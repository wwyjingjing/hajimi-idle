-- ============================================================
-- 服务端权威重算（反作弊方案 A）— 2026-08-16
-- 取代「速率墙 rate_cap」：云端不再校验客户端总分是否超速，
-- 而是用服务端公式重算「权威累计产仔」，客户端 total 仅供参考。
--
-- 核心：players_state 表存权威存档；recalc_score() RPC 每次上报时
--       用「服务端理论秒产 × 时间差」累加权威 total，写 scores 供榜单读。
--
-- 部署：Supabase SQL Editor 粘贴本文件全部执行（幂等）。
-- 依赖：docs/leaderboard-schema.sql 已执行（scores/players 表存在）。
-- ============================================================

-- 1) 权威存档表（每玩家一行）
create table if not exists public.players_state (
  player_id uuid primary key,
  state jsonb not null default '{}'::jsonb,
  total_server numeric not null default 0,
  count_server numeric not null default 0,
  pool_cost_paid numeric not null default 0,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.players_state enable row level security;
create policy "players_state 本人可读写" on public.players_state
  for all using (auth.uid() = player_id) with check (auth.uid() = player_id);

grant select, insert, update on public.players_state to anon, authenticated;
create index if not exists players_state_total_idx on public.players_state (total_server desc);

-- 2) 池子参数常量（必须与 game/config.js 数值一致！改 config 必须同步改这里）
--    prod[i] = 第 i+1 个池子的秒产（25 个）
--    cost[i] = 第 i+1 个池子的基础成本
do $$
begin
  perform 1;
end $$;

-- ============================================================
-- 3) 服务端权威重算函数
-- ============================================================
create or replace function public.recalc_score(p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public as $func$
declare
  uid uuid := auth.uid();
  prev public.players_state%rowtype;

  -- 池子秒产常量（与 config.js pools[].prod 对齐，25 项）
  pool_prod numeric[] := array[0.1,0.8,4,20,100,500,2500,13000,70000,4e5,2.2e6,1.2e7,
                             7e7,4e8,2.5e9,1.5e10,1e11,6e11,4e12,2.5e13,
                             1.5e14,8e14,4e15,2e16,1e17];
  -- 池子基础成本（与 config.js pools[].cost 对齐，25 项）
  pool_cost numeric[] := array[10,100,1000,15000,250000,4e6,6e7,1e9,1.5e10,2.5e11,4e12,7e13,
                             1.2e15,2e16,3e17,5e18,8e19,1.5e21,3e22,6e23,
                             1.2e25,2.5e26,5e27,1e29,2e30];

  now_ms numeric;
  now_ts timestamptz;
  elapsed_sec numeric;
  eff_sec numeric;
  sec_prod numeric := 0;
  evo_mult numeric := 1;
  shop_mult numeric := 1;
  theme_mult numeric := 1;
  boost_mult numeric := 1;
  rapture_mult numeric := 1;
  increment numeric;
  new_total numeric;
  new_count numeric;
  pool_cost_sum numeric := 0;

  c_pools numeric[];
  c_pool_upgrades numeric[];
  c_count numeric;
  c_total numeric;
  c_mult_level int;
  c_rapture_level int;
  c_theme text;
  c_boost_task numeric;
  c_boost_video numeric;
  c_boost_shop numeric;
  c_rapture_until numeric;
  c_play_seconds numeric;

  i int;
  n int;
  pv numeric;
  prev_pools jsonb;
  prev_pv numeric;
  is_rapture_active boolean := false;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'invalid state'; end if;

  now_ms := (extract(epoch from clock_timestamp()) * 1000);
  now_ts := clock_timestamp();

  -- 解析客户端上报（全部带默认值保护，异常字段按 0 处理）
  c_count      := coalesce((p_state->>'count')::numeric, 0);
  c_total      := coalesce((p_state->>'totalProduced')::numeric, 0);
  c_mult_level := least(greatest(coalesce((p_state->'shop'->>'multLevel')::int, 0), 0), 50);
  c_theme      := coalesce((p_state->'shop'->>'theme'), 'default');
  c_boost_task   := coalesce((p_state->'boost'->'task'->>'expiresAt')::numeric, 0);
  c_boost_video  := coalesce((p_state->'boost'->'video'->>'expiresAt')::numeric, 0);
  c_boost_shop   := coalesce((p_state->'boost'->'shop'->>'expiresAt')::numeric, 0);
  c_rapture_until:= coalesce((p_state->'rapture'->>'activeUntil')::numeric, 0);
  c_play_seconds := coalesce((p_state->'stats'->>'playSeconds')::numeric, 0);
  c_pools := coalesce((p_state->>'pools')::numeric[], '{}'::numeric[]);
  c_pool_upgrades := coalesce((p_state->'shop'->'poolUpgrades')::numeric[], '{}'::numeric[]);

  -- 读上次权威存档
  select * into prev from public.players_state where player_id = uid;
  if not found then
    prev := row(uid, '{}'::jsonb, 0, 0, 0, now_ts, now_ts)::public.players_state;
  end if;

  -- 时间差（秒），单次增量封顶 8h（离线挂机上限）
  elapsed_sec := greatest(extract(epoch from now_ts) - extract(epoch from prev.last_seen), 0);
  eff_sec := least(elapsed_sec, 8 * 3600);
  if eff_sec <= 0 then
    return jsonb_build_object('total_server', prev.total_server, 'count_server', prev.count_server, 'recalculated', false);
  end if;

  -- ===== 服务端理论秒产（不信客户端秒产，全部按服务端公式重算）=====

  -- 进化倍率：按权威 total 的数量级重算（不信客户端 evolutionLevel）
  evo_mult := power(1.2, least(greatest(floor(log(greatest(prev.total_server,1))/log(10))::int, 0), 24));

  -- 商店全局倍率 1.1^level（封顶 50）
  shop_mult := power(1.1, c_mult_level);

  -- 节日主题倍率（与 config.js shop.themes 对齐）
  case c_theme
    when 'qixi' then theme_mult := 1.1;
    when 'zhongqiu' then theme_mult := 1.15;
    when 'shengdan' then theme_mult := 1.2;
    when 'xinnian' then theme_mult := 1.25;
    else theme_mult := 1;
  end case;

  -- 三通道加速：到期时间必须 > 上次上报时间（本周期新增才生效），且不超过合理上限
  if c_boost_task  > extract(epoch from prev.last_seen)*1000 and c_boost_task  <= now_ms + 40*60*1000 then boost_mult := boost_mult * 2; end if;
  if c_boost_video > extract(epoch from prev.last_seen)*1000 and c_boost_video <= now_ms + 15*60*1000 then boost_mult := boost_mult * 2; end if;
  if c_boost_shop  > extract(epoch from prev.last_seen)*1000 and c_boost_shop  <= now_ms + 15*60*1000 then boost_mult := boost_mult * 2; end if;

  -- 狂暴：生效窗口必须 ≤ 上次上报后新增（30s 窗口），超出的判定为伪造不生效
  is_rapture_active := c_rapture_until > extract(epoch from prev.last_seen)*1000
                       and c_rapture_until <= now_ms + 30*1000;
  if is_rapture_active then rapture_mult := 7; end if;

  -- 池子秒产：Σ pools[i] × prod[i] × 2^upgrades[i]
  n := array_length(c_pools, 1);
  if n is null then n := 0; end if;
  for i in 1..n loop
    pv := c_pools[i];
    if pv is null or pv <= 0 then continue; end if;
    if i <= 25 then
      sec_prod := sec_prod + pv * pool_prod[i] * power(2, coalesce(c_pool_upgrades[i], 0));
    end if;
  end loop;

  -- 池子成本累计（几何级数 1.15^n 求和）：校验「买得起」
  for i in 1..n loop
    pv := c_pools[i];
    if pv is null or pv <= 0 then continue; end if;
    if i <= 25 then
      pool_cost_sum := pool_cost_sum + pool_cost[i] * (power(1.15, pv) - 1) / 0.15;
    end if;
  end loop;

  -- 买得起校验：客户端报的池子总成本 ≤ 服务端权威可支付额（上次 count + 本周期增量）
  -- 增量先按客户端池子算一遍用于校验；若买不起，回退用上次权威 state 的池子
  increment := sec_prod * evo_mult * shop_mult * theme_mult * boost_mult * rapture_mult * eff_sec;
  if pool_cost_sum > prev.pool_cost_paid + prev.count_server + increment then
    -- 虚报池子（买不起）→ 用上次权威存档的池子重算
    sec_prod := 0;
    prev_pools := coalesce(prev.state->'pools', '[]'::jsonb);
    for i in 1..jsonb_array_length(prev_pools) loop
      prev_pv := coalesce((prev_pools->(i-1))::numeric, 0);
      if prev_pv > 0 and i <= 25 then
        sec_prod := sec_prod + prev_pv * pool_prod[i];
      end if;
    end loop;
    increment := sec_prod * evo_mult * shop_mult * theme_mult * boost_mult * rapture_mult * eff_sec;
    pool_cost_sum := prev.pool_cost_paid;
  end if;

  -- 狂暴窗口折算：生效期 ×7，其余 ×1（分段）
  if is_rapture_active and eff_sec > 30 then
    increment := (sec_prod * rapture_mult * 30) + (sec_prod * (eff_sec - 30));
  end if;

  new_total := prev.total_server + increment;
  new_count := prev.count_server + increment;

  -- 绝对上限（宽松兜底，通关目标 1e24 的 10 倍）
  if new_total > 1e25 then
    new_total := 1e25;
    new_count := new_total;
  end if;

  -- 写权威存档
  insert into public.players_state (player_id, state, total_server, count_server, pool_cost_paid, last_seen, updated_at)
  values (uid, p_state, new_total, new_count, pool_cost_sum, now_ts, now_ts)
  on conflict (player_id) do update set
    state = excluded.state,
    total_server = excluded.total_server,
    count_server = excluded.count_server,
    pool_cost_paid = excluded.pool_cost_paid,
    last_seen = excluded.last_seen,
    updated_at = excluded.updated_at;

  -- 同步 scores（榜单数据源，total_produced = 服务端权威值；触发器 keep_max_score 兼容）
  insert into public.scores (player_id, total_produced, count, play_seconds, updated_at)
  values (uid, new_total, new_count, c_play_seconds, now_ts)
  on conflict (player_id) do update set
    total_produced = excluded.total_produced,
    count = excluded.count,
    updated_at = excluded.updated_at;

  return jsonb_build_object(
    'total_server', new_total,
    'count_server', new_count,
    'recalculated', true
  );
end $func$;

grant execute on function public.recalc_score(jsonb) to anon, authenticated;

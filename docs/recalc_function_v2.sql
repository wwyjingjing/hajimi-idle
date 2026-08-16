-- 仅函数定义（幂等，V2-LOOP-EVO 哨兵版）
create or replace function public.recalc_score(p_state jsonb)
returns jsonb language plpgsql security definer set search_path = public as $func$
-- V2-LOOP-EVO
declare
  uid uuid := auth.uid();
  prev public.players_state%rowtype;

  pool_prod numeric[] := array[0.1,0.8,4,20,100,500,2500,13000,70000,4e5,2.2e6,1.2e7,
                             7e7,4e8,2.5e9,1.5e10,1e11,6e11,4e12,2.5e13,
                             1.5e14,8e14,4e15,2e16,1e17];
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

  c_pools jsonb;
  c_pool_upgrades jsonb;
  c_count numeric;
  c_total numeric;
  c_mult_level int;
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

  c_count      := coalesce((p_state->>'count')::numeric, 0);
  c_total      := coalesce((p_state->>'totalProduced')::numeric, 0);
  c_mult_level := least(greatest(coalesce((p_state->'shop'->>'multLevel')::int, 0), 0), 50);
  c_theme      := coalesce((p_state->'shop'->>'theme'), 'default');
  c_boost_task   := coalesce((p_state->'boost'->'task'->>'expiresAt')::numeric, 0);
  c_boost_video  := coalesce((p_state->'boost'->'video'->>'expiresAt')::numeric, 0);
  c_boost_shop   := coalesce((p_state->'boost'->'shop'->>'expiresAt')::numeric, 0);
  c_rapture_until:= coalesce((p_state->'rapture'->>'activeUntil')::numeric, 0);
  c_play_seconds := coalesce((p_state->'stats'->>'playSeconds')::numeric, 0);
  c_pools := coalesce(p_state->'pools', '[]'::jsonb);
  c_pool_upgrades := coalesce(p_state->'shop'->'poolUpgrades', '[]'::jsonb);

  select * into prev from public.players_state where player_id = uid;
  if not found then
    -- 首次调用（玩家迁移/新号）：以客户端 total 为权威起点（继承历史分数），
    -- 但受「账号年龄 × 1e17」封顶（防止首次谎报超大值）。last_seen 用过去 1 秒保证首调有增量。
    declare acct_age numeric;
    begin
      select coalesce(extract(epoch from now_ts) - extract(epoch from p.created_at), 0)
        into acct_age from public.players p where p.id = uid;
      if c_total > acct_age * 1e17 then
        c_total := acct_age * 1e17;
        c_count := c_total;
      end if;
    end;
    prev := row(uid, '{}'::jsonb, c_total, c_count, 0, now_ts - interval '1 second', now_ts)::public.players_state;
  end if;

  elapsed_sec := greatest(extract(epoch from now_ts) - extract(epoch from prev.last_seen), 0);
  eff_sec := least(elapsed_sec, 8 * 3600);
  if eff_sec <= 0 then
    insert into public.players_state (player_id, state, total_server, count_server, pool_cost_paid, last_seen, updated_at)
    values (uid, p_state, prev.total_server, prev.count_server, prev.pool_cost_paid, now_ts, now_ts)
    on conflict (player_id) do update set
      state = excluded.state,
      last_seen = excluded.last_seen,
      updated_at = excluded.updated_at;
    return jsonb_build_object('total_server', prev.total_server, 'count_server', prev.count_server, 'recalculated', false);
  end if;

  -- ===== 服务端理论秒产 =====

  -- 进化倍率：循环累除 10（无 log，V2-LOOP-EVO）
  evo_mult := 1;
  declare evo_lvl int := 0; t numeric := prev.total_server;
  begin
    while t is not null and t >= 10 and evo_lvl < 24 loop
      t := t / 10;
      evo_lvl := evo_lvl + 1;
    end loop;
    evo_mult := power(1.2, evo_lvl);
  end;

  shop_mult := power(1.1, c_mult_level);

  case c_theme
    when 'qixi' then theme_mult := 1.1;
    when 'zhongqiu' then theme_mult := 1.15;
    when 'shengdan' then theme_mult := 1.2;
    when 'xinnian' then theme_mult := 1.25;
    else theme_mult := 1;
  end case;

  if c_boost_task  > extract(epoch from prev.last_seen)*1000 and c_boost_task  <= now_ms + 40*60*1000 then boost_mult := boost_mult * 2; end if;
  if c_boost_video > extract(epoch from prev.last_seen)*1000 and c_boost_video <= now_ms + 15*60*1000 then boost_mult := boost_mult * 2; end if;
  if c_boost_shop  > extract(epoch from prev.last_seen)*1000 and c_boost_shop  <= now_ms + 15*60*1000 then boost_mult := boost_mult * 2; end if;

  is_rapture_active := c_rapture_until > extract(epoch from prev.last_seen)*1000
                       and c_rapture_until <= now_ms + 30*1000;
  if is_rapture_active then rapture_mult := 7; end if;

  n := jsonb_array_length(c_pools);
  if n is null then n := 0; end if;
  for i in 1..n loop
    pv := coalesce((c_pools->(i-1))::numeric, 0);
    if pv <= 0 then continue; end if;
    if i <= 25 then
      sec_prod := sec_prod + pv * pool_prod[i] * power(2, coalesce((c_pool_upgrades->(i-1))::numeric, 0));
    end if;
  end loop;

  for i in 1..n loop
    pv := coalesce((c_pools->(i-1))::numeric, 0);
    if pv <= 0 then continue; end if;
    if i <= 25 then
      pool_cost_sum := pool_cost_sum + pool_cost[i] * (power(1.15, pv) - 1) / 0.15;
    end if;
  end loop;

  increment := sec_prod * evo_mult * shop_mult * theme_mult * boost_mult * rapture_mult * eff_sec;
  if pool_cost_sum > prev.pool_cost_paid + prev.count_server + increment then
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

  if is_rapture_active and eff_sec > 30 then
    increment := (sec_prod * rapture_mult * 30) + (sec_prod * (eff_sec - 30));
  end if;

  new_total := prev.total_server + increment;
  new_count := prev.count_server + increment;

  if new_total > 1e25 then
    new_total := 1e25;
    new_count := new_total;
  end if;

  insert into public.players_state (player_id, state, total_server, count_server, pool_cost_paid, last_seen, updated_at)
  values (uid, p_state, new_total, new_count, pool_cost_sum, now_ts, now_ts)
  on conflict (player_id) do update set
    state = excluded.state,
    total_server = excluded.total_server,
    count_server = excluded.count_server,
    pool_cost_paid = excluded.pool_cost_paid,
    last_seen = excluded.last_seen,
    updated_at = excluded.updated_at;

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
exception when others then
  return jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE, 'recalculated', false);
end $func$;

grant execute on function public.recalc_score(jsonb) to anon, authenticated;

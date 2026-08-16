-- ============================================================
-- 防作弊参数调整：放宽 rate_cap 避免误伤正常玩家（最终版 1e14）
-- 调整历程（2026-08-16）：
--   1e12 → 1e13：连点器(5次/s) + 狂暴(×7) + 三通道加速(×8) 让正常玩家
--               瞬时峰值可达 ~2.8e13/s，1e12 会误拒头部玩家
--   1e13 → 1e14：实测大狗114 满配峰值 1.8e13/s 仍被 1e13 卡住（榜上只有实际 30%），
--               再放宽到 1e14（覆盖正常峰值 3.5 倍裕量）
-- 防作弊底线不变：created_at 锚点（服务端独占不可伪造）+ 只增不减 + 绝对上限 1e18
-- 用法：Supabase SQL Editor 粘贴执行（幂等）
-- 同步：改完记得同步 docs/leaderboard-schema.sql 与 docs/adr/0002
-- ============================================================

create or replace function public.keep_max_score()
returns trigger language plpgsql security definer set search_path = public as $func$
declare
  acct_age numeric;
  rate_cap constant numeric := 1e14;  -- 已放宽：1e12 → 1e13 → 1e14（2026-08-16 定稿）
begin
  if exists (select 1 from public.players where id = new.player_id and coalesce(banned, false)) then
    raise exception 'player banned';
  end if;
  if new.total_produced > 1e18 then
    raise exception 'score beyond ceiling';
  end if;
  -- 速率核算：total ≤ 账号年龄 × 1e14（created_at 服务端权威、与客户端版本无关）
  select coalesce(extract(epoch from now()) - extract(epoch from created_at), 0)
    into acct_age from public.players where id = new.player_id;
  if new.total_produced > acct_age * rate_cap then
    raise exception 'rate implausible';
  end if;
  if tg_op = 'UPDATE' then
    new.total_produced = greatest(new.total_produced, old.total_produced);
    new.count = greatest(new.count, old.count);
    new.updated_at = now();   -- UPDATE 时刷新最后上报时间（便于运营判断活跃度）
  end if;
  new.form_level = least(greatest(floor(log(new.total_produced) / log(10))::int, 0), 24);
  return new;
end $func$;

-- 验证：触发器应仍存在
select tgname from pg_trigger where tgname = 'scores_keep_max' and not tgisinternal;

-- ============================================================
-- 防作弊参数调整：放宽 rate_cap 避免误伤正常玩家
-- 原因：连点器(5次/s) + 狂暴(×7) + 三通道加速(×8) 让正常玩家瞬时峰值
--       可达 ~2.8e13/s，原 rate_cap=1e12 会误拒头部玩家（分数冻结 + 玩家恐慌）
-- 调整：rate_cap 1e12 → 1e13（10 倍裕量，仍远高于观察值 1e10~1e11/s，
--       也远低于作弊阈值——作弊者仍受 created_at 锚点 + 只增不减约束）
-- 用法：Supabase SQL Editor 粘贴执行（幂等）
-- 同步：改完记得同步 docs/leaderboard-schema.sql 与 docs/adr/0002
-- ============================================================

create or replace function public.keep_max_score()
returns trigger language plpgsql security definer set search_path = public as $func$
declare
  acct_age numeric;
  rate_cap constant numeric := 1e13;  -- 已放宽：1e12 → 1e13（2026-08-16，避免误伤连点器+狂暴玩家）
begin
  if exists (select 1 from public.players where id = new.player_id and coalesce(banned, false)) then
    raise exception 'player banned';
  end if;
  if new.total_produced > 1e18 then
    raise exception 'score beyond ceiling';
  end if;
  -- 速率核算：total ≤ 账号年龄 × rate_cap（created_at 服务端权威、与客户端版本无关）
  select coalesce(extract(epoch from now()) - extract(epoch from created_at), 0)
    into acct_age from public.players where id = new.player_id;
  if new.total_produced > acct_age * rate_cap then
    raise exception 'rate implausible';
  end if;
  if tg_op = 'UPDATE' then
    new.total_produced = greatest(new.total_produced, old.total_produced);
    new.count = greatest(new.count, old.count);
  end if;
  new.form_level = least(greatest(floor(log(new.total_produced) / log(10))::int, 0), 24);
  return new;
end $func$;

-- 验证：触发器应仍存在
select tgname from pg_trigger where tgname = 'scores_keep_max' and not tgisinternal;

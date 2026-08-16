-- ============================================================
-- 哈基杯-基狗对邦 · 排行榜 / 账号 建表脚本（Supabase）
-- 用法：1) supabase.com 注册并创建项目
--       2) 左侧 SQL Editor → New query → 粘贴本文件全部执行
--       3) 记下 Project Settings → API 里的 Project URL 和 anon public key
-- 依赖 Supabase Auth（匿名登录），auth.uid() 即玩家 ID。
-- 安全设计：created_at/banned/updated_at/form_level 为服务端独占列（列级授权），
--           scores 无外键（避免 FK 校验强制 anon 可读 players 全表而暴露锚点），
--           触发器为 SECURITY DEFINER（内部校验以属主身份执行）。
-- ============================================================

-- 1) 玩家档案表（id 直接复用 Auth 用户 ID；created_at 由服务端默认写入，客户端不可写）
create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 16),
  faction text not null default 'kimi' check (faction in ('kimi', 'dog')),
  banned boolean not null default false,   -- 拉黑标记：服务端管理，客户端不可写
  created_at timestamptz not null default now()
);

-- 2) 成绩表（每玩家一行，保存历史峰值）
--    注意：不加外键到 players！FK 校验会要求 anon 对 players 有表级 SELECT，
--          从而暴露 created_at/banned。归属关系由 RLS「仅本人行」+ 触发器自查兜底。
create table if not exists public.scores (
  player_id uuid primary key,
  total_produced numeric not null default 0 check (total_produced >= 0),
  count numeric not null default 0 check (count >= 0),
  form_level int not null default 0,        -- 服务端按 total 重算，客户端不可写
  play_seconds numeric not null default 0,  -- 游玩时长（游戏内记录并上报；云端按此核算合理性）
  updated_at timestamptz not null default now()  -- 服务端默认写入，客户端不可写
);

-- 索引（排行榜查询用）
create index if not exists scores_leaderboard_idx on public.scores (total_produced desc);
create index if not exists scores_players_idx on public.scores (player_id);

-- 3) RLS：行级（全员可读排行榜，写仅限本人）
alter table public.players enable row level security;
alter table public.scores enable row level security;

create policy "players 全员可读" on public.players for select using (true);
create policy "players 本人可建" on public.players for insert with check (auth.uid() = id);
create policy "players 本人可改" on public.players for update using (auth.uid() = id);
create policy "players 本人可删" on public.players for delete using (auth.uid() = id);

create policy "scores 全员可读" on public.scores for select using (true);
create policy "scores 本人可写" on public.scores for insert with check (auth.uid() = player_id);
create policy "scores 本人可改" on public.scores for update using (auth.uid() = player_id);
create policy "scores 本人可删" on public.scores for delete using (auth.uid() = player_id);

-- 4) 列级授权（关键防线）：客户端只能写/读白名单列
--    · players.created_at / banned：服务端独占，客户端不可读不可写（锚点与拉黑不可伪造）
--    · scores.updated_at / form_level：服务端独占
--    · scores 无 SELECT 授权（原始分数/时长不泄露，只经视图读）
--    · 主键列 UPDATE/SELECT 是 PostgREST 普通写路径所需（受 RLS 仅本人行约束，改自己 id 属自锁非攻击）
revoke all on public.players from anon, authenticated;
grant select (id, nickname, faction) on public.players to anon, authenticated;
grant insert (id, nickname, faction) on public.players to anon, authenticated;
grant update (id, nickname, faction) on public.players to anon, authenticated;

revoke all on public.scores from anon, authenticated;
grant select (player_id) on public.scores to anon, authenticated;
grant insert (player_id, total_produced, count, play_seconds) on public.scores to anon, authenticated;
grant update (total_produced, count, play_seconds) on public.scores to anon, authenticated;

-- 5) 成绩防作弊触发器（SECURITY DEFINER：内部 players 查询以属主身份执行）
--    · 绝对上限 1e18（纯兜底；速率核算才是真约束。早期 1e15 上限会锁住逼近的头部玩家，已抬升）
--    · 速率核算用「账号年龄」（created_at 服务端权威、与客户端版本/play_seconds 无关，不会误锁）
--      ——注意：早期版本用客户端 play_seconds 核算，旧客户端不传该字段导致全部误锁，已废弃
--    · 无增量锁（早期增量 ≤1e14 会锁住高产能玩家追涨，已移除；速率核算已覆盖其防作弊作用）
--    · 只增不减；form_level 由服务端按 total 重算（与进化等级一致，客户端伪造无效）
create or replace function public.keep_max_score()
returns trigger language plpgsql security definer set search_path = public as $func$
declare
  acct_age numeric;
  rate_cap constant numeric := 1e12;
begin
  if exists (select 1 from public.players where id = new.player_id and coalesce(banned, false)) then
    raise exception 'player banned';
  end if;
  if new.total_produced > 1e18 then
    raise exception 'score beyond ceiling';
  end if;
  -- 速率核算：total ≤ 账号年龄 × 1e12（正常玩家产能远低于此，观察值 ~1e10~1e11/s）
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

create trigger scores_keep_max
  before insert or update on public.scores
  for each row execute function public.keep_max_score();

-- 6) 排行榜展示视图：仅 4 列脱敏 + 过滤拉黑（前端唯一读路径；非 security_invoker，属主执行）
create or replace view public.leaderboard as
select s.player_id, p.nickname, p.faction, s.total_produced
from public.scores s
join public.players p on p.id = s.player_id
where coalesce(p.banned, false) = false;

grant select on public.leaderboard to anon, authenticated;

-- 7) 前端读写约定
--    上报（两步走，不用 upsert——upsert 要求整表 SELECT 权限会泄露原始数据）：
--      1) update scores set total_produced, count, play_seconds where player_id = <uid>
--      2) 未命中则 insert (player_id, total_produced, count, play_seconds)
--    读榜：  select * from leaderboard order by total_produced desc limit 100
--    我的：  select total_produced from leaderboard where player_id = <uid>
--    运营拉黑：update public.players set banned = true where nickname = '作弊者昵称';

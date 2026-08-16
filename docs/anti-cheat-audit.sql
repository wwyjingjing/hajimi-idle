-- ============================================================
-- 全榜速率核算 + 作弊识别（运营只读脚本）
-- 用法：Supabase 控制台 → SQL Editor → 粘贴本文件全部执行（只读 SELECT，安全）
-- 依据：spec/issues/08-leaderboard-security-ops.md §5.1
-- 核算规则：累计养出 total ≤ 账号年龄(秒) × 1e12（rate_cap）
-- ============================================================

-- ① 全榜速率核算：Top 60 每个玩家的年龄/速率/上限对比
select
  p.nickname,
  p.faction,
  p.banned,
  s.total_produced,
  round(extract(epoch from now() - p.created_at))                 as age_sec,
  round(extract(epoch from now() - p.created_at)/3600, 1)         as age_hours,
  round(s.total_produced / greatest(extract(epoch from now() - p.created_at), 1)) as rate_per_sec,
  round(extract(epoch from now() - p.created_at) * 1e12)          as rate_cap,
  case when s.total_produced > extract(epoch from now() - p.created_at) * 1e12
       then '🚨 超标(理论不可能上报成功)'
       when s.total_produced > extract(epoch from now() - p.created_at) * 5e11
       then '⚠️ 逼近上限(可疑)'
       else '✅ 正常' end                                        as verdict
from public.scores s
join public.players p on p.id = s.player_id
order by s.total_produced desc
limit 60;

-- ② 异常信号扫描：速率 > 5e11/s 的玩家（正常玩家 ~1e10~1e11/s，超过 5 倍就要警惕）
select
  p.nickname, p.faction, p.created_at,
  s.total_produced,
  round(extract(epoch from now() - p.created_at)) as age_sec,
  round(s.total_produced / greatest(extract(epoch from now() - p.created_at), 1)) as rate_per_sec
from public.scores s
join public.players p on p.id = s.player_id
where s.total_produced > extract(epoch from now() - p.created_at) * 5e11
order by rate_per_sec desc;

-- ③ 疑似养号群：同一天建号的高分账号（批量注册特征）
select
  date_trunc('day', p.created_at) as signup_day,
  count(*) as player_count,
  max(s.total_produced) as max_total
from public.players p
left join public.scores s on s.player_id = p.id
group by 1
having count(*) >= 3
order by max_total desc nulls last;

-- ④ 拉黑状态一览（当前已拉黑账号）
select p.nickname, p.faction, p.created_at,
       s.total_produced
from public.players p
left join public.scores s on s.player_id = p.id
where p.banned = true
order by s.total_produced desc nulls last;

-- ⑤ 极低分数却存在很久的账号（可能是测试号/占位）
select p.nickname, p.faction,
       round(extract(epoch from now() - p.created_at)/3600, 1) as age_hours,
       s.total_produced
from public.players p
left join public.scores s on s.player_id = p.id
where s.total_produced < 100 and extract(epoch from now() - p.created_at) > 24*3600
order by age_hours desc
limit 20;

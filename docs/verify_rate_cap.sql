-- ============================================================
-- 精确验证 rate_cap（只匹配常量赋值，排除注释）
-- 用法：Supabase SQL Editor 粘贴执行
-- 期望：rate_cap_value = 1e13（不是 1e12）
-- ============================================================

-- ① 精确提取 rate_cap 赋值（排除注释里的 1e12→1e13 字样）
select proname,
       (pg_get_functiondef(oid) ~ 'rate_cap constant numeric := 1e13') as has_new_cap_assign,
       (pg_get_functiondef(oid) ~ 'rate_cap constant numeric := 1e12') as has_old_cap_assign
from pg_proc
where proname = 'keep_max_score';

-- ② 触发器仍挂在 scores 表上
select tgname, tgrelid::regclass as on_table
from pg_trigger
where tgname = 'scores_keep_max' and not tgisinternal;

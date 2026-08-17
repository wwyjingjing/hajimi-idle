-- ============================================================
-- 哈基杯-基狗对邦 · 游戏内动态配置表（Supabase）
-- 用途：推广位列表 / 看板地址与群号 / 分享链接 / 应援默认地址 / 新闻栏，
--       全部由运营在后端数据库维护；前端启动时拉取，失败回退本地 config.js。
-- 用法：1) 在 Supabase SQL Editor 粘贴本文件执行；或
--       2) node apply_schema.mjs（会执行 docs/leaderboard-schema.sql）
--          另执行本文件：node apply_site_config.mjs（见 game/ 下脚本）
-- 安全：内容全部为公开运营配置（原本就在前端 bundle 里），匿名只读即可；
--       写路径仅服务端（运营用 SQL 编辑 / 控制台），不开放给客户端。
-- ============================================================

-- 1) 配置表：key 为主键，value 为 JSONB（一条 key 存一种配置的完整内容）
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  enabled boolean not null default true
);

-- 2) RLS：全员可读（公开配置），禁写（客户端不可改配置）
alter table public.site_config enable row level security;
create policy "site_config 全员可读" on public.site_config for select using (true);

-- 3) 授权：匿名/登录用户只读
revoke all on public.site_config from anon, authenticated;
grant select on public.site_config to anon, authenticated;

-- 4) 种子数据（与 config.js 当前值对齐；on conflict 保留已有人工修改）
insert into public.site_config (key, value) values
('featured', '[
  {"title":"【基狗对邦应援】SHOUT（呐喊）纯良应援教学","bvid":"BV1Hd3J6dEfa","author":"吴吴又京京","ready":true},
  {"title":"我是真的爱哈你","bvid":"BV1ubgj69EFx","author":"樱栾阡陌","ready":true},
  {"title":"一堆棍母【哈基杯应援】","bvid":"BV13xuy6iEqA","author":"Fishe_Le","ready":true},
  {"title":"大狗叫：嚼叫","bvid":"BV1MSuC6wEU6","author":"SalvatoreSolace","ready":true},
  {"title":"电棍，哈基米：直到大地颗变成一酸橙","bvid":"BV1m7gH6iEzV","author":"爱布拉娜p","ready":true},
  {"title":"叮咚鸡怀旧小卖部【哈基杯应援】","bvid":"BV1EkgA6qEvo","author":"南华真人666","ready":true},
  {"title":"走近哈基屋","bvid":"BV1cfb96eEfG","author":"永雏塔顺费","ready":true},
  {"title":"【哈基杯应援】除草机音乐","bvid":"BV1m3bv6XEdd","author":"海绵宝宝非谦儿","ready":true},
  {"title":"【基狗对邦应援】😺聪明的基米😺","bvid":"BV1Vnbe6ZEXV","author":"勇者アリス","ready":true}
]'::jsonb),
('board', '{"url":"https://cb205ceeef4f4527a2515517d585571c.bj5.agentos-app.net","group":"765996335"}'::jsonb),
('share', '{"link":"https://www.bilibili.com/toy/hajimi-idle-public/index.html"}'::jsonb),
('collection_url', '"https://space.bilibili.com/3546815827806287"'::jsonb),
('news', '[
  "🐾 官方倡议：为保护濒危哈基米，请大量繁殖它们！",
  "📢 繁殖即保护——每多一只哈基米，世界就多一分柔软。",
  "🌏 让哈基米遍布每一个位面，是我们的光荣使命。",
  "❤️ 别让你的哈基米孤单，多喂一口，多生一窝。",
  "🐶 哈基汪保护协会：多养、多生、多晒太阳。",
  "🏠 给每只哈基米一个家，从下水道到时空位面。",
  "📣 关爱小动物，从点一下\"喂食\"开始。",
  "🌟 亿亿亿哈基米不是梦，是保护动物的小目标。"
]'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 5) 运营更新示例（改任一 key 的 value 即可，无需重新构建/部署游戏）：
--    update public.site_config set value = '[...]'::jsonb where key = 'featured';
--    update public.site_config set value = '{"url":"...","group":"..."}'::jsonb where key = 'board';
--    前端下次启动（或刷新页面）自动拉取最新内容。

// 排行榜安全加固：
// 1) 列级权限：created_at/banned/updated_at 服务端独占，客户端不可写不可读
// 2) leaderboard 视图只暴露展示所需 4 列（脱敏），不再 security_invoker
// 3) 触发器：form_level 服务端按 total 重算（客户端伪造无效）；速率上限放宽到 1e12/s（避免误伤正常后期产能）
// 4) 清理作弊账号：删除伪造锚点的 素裳/极限测试员；拉黑 SilverWolfLv.999
import pg from 'pg';
const { Client } = pg;
const c = new Client({
  host: 'db.sboaeygtztyubizypvrc.supabase.co', port: 5432,
  user: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres', ssl: { rejectUnauthorized: false },
});
await c.connect();

// ---- 1) 列级权限 ----
await c.query(`
revoke all on public.players from anon, authenticated;
grant select (id, nickname, faction) on public.players to anon, authenticated;
grant insert (id, nickname, faction) on public.players to anon, authenticated;
grant update (nickname, faction) on public.players to anon, authenticated;`);
console.log('✅ players 列权限：created_at/banned 客户端不可读写');

await c.query(`
revoke all on public.scores from anon, authenticated;
grant insert (player_id, total_produced, count, play_seconds) on public.scores to anon, authenticated;
grant update (total_produced, count, play_seconds) on public.scores to anon, authenticated;`);
console.log('✅ scores 列权限：updated_at 服务端独占，读仅经视图');

// ---- 2) 视图（4 列脱敏 + 过滤拉黑）----
await c.query('drop view if exists public.leaderboard');
await c.query(`
create or replace view public.leaderboard as
select s.player_id, p.nickname, p.faction, s.total_produced
from public.scores s
join public.players p on p.id = s.player_id
where coalesce(p.banned, false) = false;`);
await c.query('grant select on public.leaderboard to anon, authenticated');
console.log('✅ leaderboard 视图：仅 4 列、过滤拉黑、匿名可读');

// ---- 3) 触发器：form_level 服务端重算 + 速率上限 1e12 ----
await c.query(`
create or replace function public.keep_max_score()
returns trigger language plpgsql as $func$
declare
  acct_age numeric;
  rate_cap constant numeric := 1e12;
begin
  if exists (select 1 from public.players where id = new.player_id and coalesce(banned, false)) then
    raise exception 'player banned';
  end if;
  if new.total_produced > 1e15 then
    raise exception 'score beyond ceiling';
  end if;
  if new.play_seconds is not null and new.play_seconds > 0 then
    select coalesce(extract(epoch from now()) - extract(epoch from created_at), 0)
      into acct_age from public.players where id = new.player_id;
    if new.play_seconds > acct_age + 600 then
      raise exception 'play time beyond account age';
    end if;
    if new.total_produced > new.play_seconds * rate_cap then
      raise exception 'rate implausible';
    end if;
  end if;
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.scores where player_id = new.player_id)
       and new.total_produced > 1e13 then
      raise exception 'first score implausible';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    if new.total_produced - old.total_produced > 1e14 then
      raise exception 'score delta implausible';
    end if;
    new.total_produced = greatest(new.total_produced, old.total_produced);
    new.count = greatest(new.count, old.count);
  end if;
  -- 形态等级服务端按总分重算（与进化等级一致，客户端伪造无效）
  new.form_level = least(greatest(floor(log(new.total_produced) / log(10))::int, 0), 24);
  return new;
end $func$;`);
console.log('✅ 触发器：form_level 服务端重算 + 速率上限 1e12/s');

// ---- 4) 清理作弊 ----
const d1 = await c.query("delete from public.scores where player_id in (select id from public.players where nickname in ('素裳','极限测试员'))");
const d2 = await c.query("delete from public.players where nickname in ('素裳','极限测试员')");
const b1 = await c.query("update public.players set banned = true where nickname = 'SilverWolfLv.999'");
console.log(`✅ 清理：删除 素裳/极限测试员（成绩 ${d1.rowCount}，玩家 ${d2.rowCount}）；拉黑 SilverWolfLv.999（${b1.rowCount} 行）`);

// ---- 验证 ----
const top = await c.query("select nickname, total_produced from public.leaderboard order by total_produced desc limit 8");
console.log('=== 加固后榜单前 8 ===');
top.rows.forEach((r, i) => console.log(`${i + 1}. ${r.nickname} ${r.total_produced}`));
const cols = await c.query(`
  select table_name, column_name, privilege_type
  from information_schema.column_privileges
  where grantee = 'anon' and table_schema = 'public' and table_name in ('players','scores')
  order by table_name, column_name`);
console.log('=== anon 列权限 ===');
cols.rows.forEach((r) => console.log(`  ${r.table_name}.${r.column_name} [${r.privilege_type}]`));

await c.end();

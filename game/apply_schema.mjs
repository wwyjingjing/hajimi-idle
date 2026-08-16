// 一键执行排行榜建表脚本（Supabase 直连）
// 用法：node apply_schema.mjs <数据库密码>
// 或：$env:SUPABASE_DB_PASSWORD='<密码>'; node apply_schema.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;
const here = path.dirname(fileURLToPath(import.meta.url));
const password = process.env.SUPABASE_DB_PASSWORD || process.argv[2] || '';
if (!password) {
  console.error('请通过命令行参数或环境变量 SUPABASE_DB_PASSWORD 传入数据库密码');
  process.exit(1);
}
const sql = readFileSync(path.join(here, '..', 'docs', 'leaderboard-schema.sql'), 'utf8');
const client = new Client({
  host: 'db.sboaeygtztyubizypvrc.supabase.co',
  port: 5432,
  user: 'postgres',
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});
await client.connect();
try {
  await client.query(sql);
  console.log('✅ 建表脚本执行成功');
  const res = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_name in ('players','scores') order by table_name"
  );
  console.log('现有表:', res.rows.map((r) => r.table_name).join(', '));
  const pol = await client.query("select policyname from pg_policies where schemaname='public' order by policyname");
  console.log('RLS 策略数:', pol.rows.length);
} catch (e) {
  console.error('❌ 执行失败:', e.message);
  process.exitCode = 1;
}
await client.end();

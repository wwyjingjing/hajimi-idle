// 安全加固验证：伪造锚点/自解封/读表均被列级权限拦截；正常流程可用
import { createClient } from '@supabase/supabase-js';
const base = 'https://sboaeygtztyubizypvrc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNib2FleWd0enR5dWJpenlwdnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3ODgxNzYsImV4cCI6MjEwMjM2NDE3Nn0.RXOOx7G34D32TK40UGNuE4bngdfdsZRSYJ8Fx0JaMoU';
const sb = createClient(base, anonKey);
const { data: su } = await sb.auth.signInAnonymously();
const uid = su.user.id;
await sb.from('players').upsert({ id: uid, nickname: '加固验证', faction: 'kimi' }, { onConflict: 'id' });
await new Promise((r) => setTimeout(r, 2000));

// 1) 伪造 created_at（锚点）→ 应被拒
const a1 = await sb.from('players').update({ created_at: '2020-01-01T00:00:00Z' }).eq('id', uid);
console.log('1 伪造 created_at:', a1.error ? `拒(${a1.error.message.slice(0, 40)})` : '通过(异常!)');

// 2) 自解封 banned → 应被拒
const a2 = await sb.from('players').update({ banned: false }).eq('id', uid);
console.log('2 自改 banned:', a2.error ? `拒(${a2.error.message.slice(0, 40)})` : '通过(异常!)');

// 3) 正常上报（不含 form_level/updated_at）→ 应通过，form_level 服务端自动算
const { error: e3 } = await sb.from('scores').upsert(
  { player_id: uid, total_produced: 123456, count: 100, play_seconds: 5 }, { onConflict: 'player_id' });
console.log('3 正常上报:', e3 ? `拒(${e3.message.slice(0, 40)})` : '通过');

// 4) 读取：视图仅 4 列；scores 原表读不到；players 读不到 created_at
const v = await sb.from('leaderboard').select('*').eq('player_id', uid).maybeSingle();
console.log('4 视图字段:', v.data ? Object.keys(v.data).join(',') : '无', '| 应只有 player_id,nickname,faction,total_produced');
const raw = await sb.from('scores').select('*').eq('player_id', uid).maybeSingle();
console.log('5 原表读 scores:', raw.error ? `拒(${raw.error.message.slice(0, 40)})` : '能读(异常!)');
const p = await sb.from('players').select('*').eq('id', uid).maybeSingle();
console.log('6 players 可见字段:', p.data ? Object.keys(p.data).join(',') : '无', '| created_at/banned 不应出现');

// 清理
await sb.from('scores').delete().eq('player_id', uid);
await sb.from('players').delete().eq('id', uid);
console.log('已清理');

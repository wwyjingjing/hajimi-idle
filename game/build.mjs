// 零依赖打包：把 config.js + core.js + ui.js 合并成一个无 import/export 的经典脚本 app.bundle.js。
// 这样 index.html 无需 ES 模块即可运行（直接双击 file:// 打开也能玩，静态托管/http 更没问题）。
// 用法：编辑 config.js / core.js / ui.js 后，运行 `node build.mjs` 重新生成 app.bundle.js。
// core.test.js 仍直接 import ./core.js（ESM），不受本打包影响。

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const files = ['config.js', 'core.js', 'ui.js'];

// 去掉（可跨行的）import 语句：从 import 起，到含分号的行止。
function stripImports(src) {
  const lines = src.split('\n');
  const out = [];
  let inImport = false;
  for (const line of lines) {
    if (!inImport && /^\s*import\b/.test(line)) inImport = true;
    if (!inImport) out.push(line);
    if (inImport && line.includes(';')) inImport = false;
  }
  return out.join('\n');
}

let out = '// 本文件由 build.mjs 自动生成，请勿手改。\n';
out += '// 修改 config.js / core.js / ui.js 后运行 `node build.mjs` 重新生成。\n';
out += '(function () {\n"use strict";\n';

for (const f of files) {
  let src = readFileSync(join(here, f), 'utf8');
  src = stripImports(src);
  // 去掉 export 关键字（export const / export function / export let / export class）
  src = src.replace(/^export\s+(?=function\b|const\b|let\b|class\b)/gm, '');
  out += `\n// ============ ${f} ============\n${src}\n`;
}

out += '\n})();\n';
writeFileSync(join(here, 'app.bundle.js'), out, 'utf8');
console.log('已生成 app.bundle.js');

// 生成 24 张 SVG 占位图（12 形态 × 2 阵营）到 assets/，供替换为真实美术。
// 用法：node gen_assets.mjs（换真图时直接覆盖同名文件即可，游戏按 assets/{阵营}-{等级}.svg 加载）
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, 'assets');
mkdirSync(assets, { recursive: true });

const factions = {
  kimi: { emoji: '🐱', c1: '#ffd9e6', c2: '#ff6fa5' },
  dog: { emoji: '🐶', c1: '#dbe6ff', c2: '#4f7cff' },
};

for (const [fid, f] of Object.entries(factions)) {
  for (let level = 0; level < 12; level++) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${f.c1}"/><stop offset="1" stop-color="${f.c2}"/></linearGradient></defs><rect width="200" height="200" rx="28" fill="url(#g)"/><text x="100" y="118" font-size="92" text-anchor="middle">${f.emoji}</text><text x="100" y="186" font-size="18" text-anchor="middle" fill="#fff" font-weight="bold">Lv.${level}</text></svg>`;
    writeFileSync(join(assets, `${fid}-${level}.svg`), svg, 'utf8');
  }
}
console.log('已生成 24 张 SVG 占位图到 assets/');

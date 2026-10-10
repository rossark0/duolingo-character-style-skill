// reference/render-sheet.mjs
// A contact sheet with every pose of both example characters, to check the
// drawing after any change. Usage: node reference/render-sheet.mjs <folder>
// then open <folder>/sheet.svg in a browser.
import fs from 'node:fs';
import path from 'node:path';
import { POSES, person, partToSvg, fill } from './kit.mjs';

const out = process.argv[2] ?? 'sheet-out';
fs.mkdirSync(out, { recursive: true });

// a desk in front of the stress pose (the pose expects the scene to hide the body below the elbows)
const DESK = fill('M-190 150H190V330H-190Z', '#5B6B8C');

const cells = [];
for (const character of ['bob', 'curls']) {
  for (const id of Object.keys(POSES)) cells.push({ id, character, muted: false });
}
cells.push({ id: 'selfHug', character: 'bob', muted: true });

const COLS = 5;
const CELL_W = 300;
const CELL_H = 420;
const S = 0.8;
const body = cells.map(({ id, character, muted }, i) => {
  const x = 150 + (i % COLS) * CELL_W;
  const y = 150 + Math.floor(i / COLS) * CELL_H;
  const parts = person(id, { character, muted });
  const all = id === 'holdHead' ? [...parts, DESK] : parts;
  const label = `${id} (${character}${muted ? ', muted' : ''})`;
  return (
    `<g transform="translate(${x} ${y}) scale(${S})">${all.map(partToSvg).join('')}</g>` +
    `<text x="${x}" y="${y + 255}" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#9A9AA8" text-anchor="middle">${label}</text>`
  );
});
const W = COLS * CELL_W;
const H = Math.ceil(cells.length / COLS) * CELL_H + 40;
fs.writeFileSync(
  path.join(out, 'sheet.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#24212C"/>${body.join('')}</svg>`,
);
console.log(`ok: ${path.join(out, 'sheet.svg')} (${cells.length} drawings)`);

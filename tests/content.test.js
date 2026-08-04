import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS, LEVELS } from '../src/config.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(join(root, file), 'utf8');

test('版本口径统一为十关、四十风物和动态总星', () => {
  assert.equal(LEVELS.length, 10);
  assert.equal(ITEMS.length, 40);
  assert.equal(ITEMS.filter(item => !item.secret).length, 34);
  const files = ['index.html', 'README.md', ...readdirSync(join(root, 'src'), { recursive:true })
    .filter(file => file.endsWith('.js')).map(file => join('src', file))];
  const text = files.map(file => read(file)).join('\n');
  assert.doesNotMatch(text, /\/18\b|金陵五景|收集\s*18\s*件|图鉴集齐\s*\+?\s*15\s*星/);
  assert.match(read('index.html'), /金陵十景/);
  assert.match(read('index.html'), /40 件风物/);
  assert.match(read('src/share.js'), /LEVELS\.length\s*\*\s*3/);
});

test('照片清单只标记实际存在的 18 件风物', () => {
  const photos = ITEMS.filter(item => item.photo);
  assert.equal(photos.length, 18);
  for(const item of photos) assert.equal(existsSync(join(root, 'assets', 'img', `it_${item.id}.jpg`)), true, item.id);
});

test('全部关卡背景同时具有 WebP 和 JPEG 回退', () => {
  const ids = new Set(['menu', ...LEVELS.map(level => level.landmark)]);
  for(const id of ids){
    assert.equal(existsSync(join(root, 'assets', 'img', `bg_${id}.webp`)), true, `${id}.webp`);
    assert.equal(existsSync(join(root, 'assets', 'img', `bg_${id}.jpg`)), true, `${id}.jpg`);
  }
});

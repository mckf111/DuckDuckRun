import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS, LEVELS } from '../src/config.js';
import { ALBUM_PHOTOS } from '../src/album-photos.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = file => readFileSync(join(root, file), 'utf8');

test('游戏本体保留所有权利且不开放 MIT 复用', () => {
  const license = read('LICENSE.md');
  assert.match(license, /保留一切权利|保留所有权利/);
  assert.match(license, /禁止/);
  assert.doesNotMatch(license, /MIT License|Permission is hereby granted, free of charge/);
  assert.equal(existsSync(join(root, 'assets', 'fonts', 'OFL.txt')), true);
  assert.match(read('src/config.js'), /步行斜拉桥/);
  assert.doesNotMatch(read('src/config.js'), /摩天轮桥/);
});

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

test('40 件照片结果与配置一致，采用照片全部存在', () => {
  assert.deepEqual(Object.keys(ALBUM_PHOTOS).sort(),ITEMS.map(item=>item.id).sort());
  for(const item of ITEMS){
    assert.equal(item.photo,!!ALBUM_PHOTOS[item.id].file,item.id);
    if(item.photo)assert.equal(existsSync(join(root,ALBUM_PHOTOS[item.id].file)),true,item.id);
  }
});

test('全部关卡背景同时具有 WebP 和 JPEG 回退', () => {
  const ids = new Set(['menu', ...LEVELS.map(level => level.landmark)]);
  for(const id of ids){
    assert.equal(existsSync(join(root, 'assets', 'img', `bg_${id}.webp`)), true, `${id}.webp`);
    assert.equal(existsSync(join(root, 'assets', 'img', `bg_${id}.jpg`)), true, `${id}.jpg`);
  }
});

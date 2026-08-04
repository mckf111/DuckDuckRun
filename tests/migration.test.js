import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/config.js';
import { SAVE_SCHEMA, normalizeSave } from '../src/rules.js';

test('存档迁移覆盖标量、非法值、旧教学字段和超范围升级', () => {
  const scalar = normalizeSave(123);
  assert.equal(scalar.schema, SAVE_SCHEMA);
  assert.equal(scalar.stars.length, 10);
  const dirty = normalizeSave({
    best:Infinity, stars:'bad', cleared:3, album:{ fake:true, [ITEMS[0].id]:true },
    tutorialDone:1, coins:-9, distTotal:Infinity, ups:{ magnet:99, gui:-5, spawn:'bad' },
  });
  assert.equal(dirty.best, 0);
  assert.deepEqual(dirty.album, { [ITEMS[0].id]:true });
  assert.equal(dirty.tutorialCompleted, true);
  assert.equal(dirty.coins, 0);
  assert.deepEqual(dirty.ups, { magnet:3, gui:0, spawn:0 });
});

test('6 关旧档迁桥到第 10 站，重复迁移不再挪动', () => {
  const migrated = normalizeSave({
    stars:[3,2,1,0,0,2], cleared:[true,true,true,false,false,true], album:{ duck:true }, tut:true,
  });
  assert.equal(migrated.stars[5], 0);
  assert.equal(migrated.cleared[5], false);
  assert.equal(migrated.stars[9], 2);
  assert.equal(migrated.cleared[9], true);
  assert.deepEqual(normalizeSave(migrated), migrated);
});

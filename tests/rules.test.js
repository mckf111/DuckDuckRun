import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, RUN_STAR_THRESHOLDS } from '../src/config.js';
import {
  BRIDGE_INDEX,
  NORMAL_ITEM_IDS,
  SAVE_SCHEMA,
  calculateRunStars,
  canPassObstacle,
  getBridgeUnlockStatus,
  normalizeSave,
} from '../src/rules.js';

test('障碍语法：low 只跳、high 只贴地滑铲、full 只能换道', () => {
  assert.equal(canPassObstacle({ y:0, sliding:0 }, { type:'low' }), false);
  assert.equal(canPassObstacle({ y:0.73, sliding:0 }, { type:'low' }), true);
  assert.equal(canPassObstacle({ y:0, sliding:0.4 }, { type:'high' }), true);
  assert.equal(canPassObstacle({ y:0.4, sliding:0.4 }, { type:'high' }), false);
  assert.equal(canPassObstacle({ y:99, sliding:1 }, { type:'full' }), false);
});

test('星级只看本局实际印记', () => {
  assert.deepEqual([0, 7, 8, 14, 20, 999].map(n => calculateRunStars(n, RUN_STAR_THRESHOLDS)), [0, 0, 1, 2, 3, 3]);
});

function bridgeSave({ ordinary=28, stars=15, missingClear=false, bridgeCleared=false } = {}){
  const album = Object.fromEntries(NORMAL_ITEM_IDS.slice(0, ordinary).map(id => [id, true]));
  const starList = Array(10).fill(0);
  for(let i=0, left=stars; i<9 && left>0; i++){
    starList[i] = Math.min(3, left);
    left -= starList[i];
  }
  const cleared = Array(10).fill(false);
  for(let i=0;i<9;i++) cleared[i] = true;
  if(missingClear) cleared[4] = false;
  cleared[BRIDGE_INDEX] = bridgeCleared;
  return { album, stars:starList, cleared };
}

test('大桥解锁边界：28/34、15 星、前九关缺一不可', () => {
  assert.equal(getBridgeUnlockStatus(bridgeSave()).unlocked, true);
  assert.equal(getBridgeUnlockStatus(bridgeSave({ ordinary:27 })).unlocked, false);
  assert.equal(getBridgeUnlockStatus(bridgeSave({ stars:14 })).unlocked, false);
  assert.equal(getBridgeUnlockStatus(bridgeSave({ missingClear:true })).unlocked, false);
});

test('已通大桥旧档继续开放，假图鉴键不能参与解锁', () => {
  assert.equal(getBridgeUnlockStatus(bridgeSave({ ordinary:0, stars:0, missingClear:true, bridgeCleared:true })).unlocked, true);
  const dirty = bridgeSave({ ordinary:27 });
  dirty.album.fake_1 = true;
  dirty.album.fake_2 = true;
  const status = getBridgeUnlockStatus(dirty);
  assert.equal(status.ordinaryCount, 27);
  assert.equal(status.unlocked, false);
});

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

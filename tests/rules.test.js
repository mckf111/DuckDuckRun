import test from 'node:test';
import assert from 'node:assert/strict';
import { RUN_STAR_THRESHOLDS } from '../src/config.js';
import {
  BRIDGE_INDEX,
  NORMAL_ITEM_IDS,
  calculateRunStars,
  canPassObstacle,
  getBridgeUnlockStatus,
  getCollectionWeight,
  getObstacleInstruction,
} from '../src/rules.js';

test('障碍语法：low 只跳、high 只贴地滑铲、full 只能换道', () => {
  assert.equal(canPassObstacle({ y:0, sliding:0 }, { type:'low' }), false);
  assert.equal(canPassObstacle({ y:0.73, sliding:0 }, { type:'low' }), true);
  assert.equal(canPassObstacle({ y:0, sliding:0.4 }, { type:'high' }), true);
  assert.equal(canPassObstacle({ y:0.4, sliding:0.4 }, { type:'high' }), false);
  assert.equal(canPassObstacle({ y:99, sliding:1 }, { type:'full' }), false);
  assert.match(getObstacleInstruction('full'), /只能换道/);
  assert.match(getObstacleInstruction('high',true), /下滑/);
});

test('星级只看本局实际印记', () => {
  assert.deepEqual([0, 7, 8, 14, 20, 999].map(n => calculateRunStars(n, RUN_STAR_THRESHOLDS)), [0, 0, 1, 2, 3, 3]);
});

test('普通风物掉落权重：已拥有 1、未拥有 6，三局无新物后提高', () => {
  const item={id:'x',secret:false};
  assert.equal(getCollectionWeight(item,{album:{x:true},albumDryRuns:9},-1),1);
  assert.equal(getCollectionWeight(item,{album:{},albumDryRuns:2},-1),6);
  assert.equal(getCollectionWeight(item,{album:{},albumDryRuns:3},-1),12);
  assert.equal(getCollectionWeight({...item,secret:true},{album:{}},-1),0);
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

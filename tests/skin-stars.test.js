import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSave,calculateMedals,totalStars,recordBestStars,skinUnlocked,effectiveSkin} from '../src/rules.js';

test('每关一至三星；历史最好成绩跨难度只记录一次',()=>{
  assert.equal(calculateMedals(10,40,[]).stars,1);
  assert.equal(calculateMedals(40,40,[]).stars,2);
  assert.equal(calculateMedals(40,40,['a','b']).stars,3);
  assert.equal(calculateMedals(40,40,['a','a']).stars,2);
  const save=normalizeSave({stars:[2],medals:{easy:[{clear:true,collect:true,skill:true}]}});
  recordBestStars(save,0,2);recordBestStars(save,0,1);
  assert.equal(totalStars(save),2,'累计印章和重复通关不额外加星');
  recordBestStars(save,0,3);assert.equal(totalStars(save),3);
  recordBestStars(save,0,2);assert.equal(totalStars(save),3,'换难度不降低或叠加最高星级');
});

test('14 到 15 星解锁金鸭不扣星；非法与未解锁皮肤安全回退',()=>{
  const save=normalizeSave({stars:[3,3,3,3,2],selectedSkin:'gold'});
  assert.equal(save.selectedSkin,'white');assert.equal(totalStars(save),14);
  assert.equal(skinUnlocked(save,'gold'),false);assert.equal(skinUnlocked(save,'white'),true);
  assert.equal(skinUnlocked(save,'invalid'),false);
  recordBestStars(save,4,3);assert.equal(skinUnlocked(save,'gold'),true);
  save.selectedSkin='gold';assert.equal(effectiveSkin(save),'gold');assert.equal(totalStars(save),15);
  assert.equal(normalizeSave(save).selectedSkin,'gold');
  save.selectedSkin='invalid';assert.equal(effectiveSkin(save),'white');
});

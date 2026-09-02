import test from 'node:test';
import assert from 'node:assert/strict';

function installCanvasStub(){
  const context = { setTransform(){} };
  global.window = { devicePixelRatio:1, innerWidth:960, innerHeight:540 };
  global.document = { getElementById:() => ({ getContext:() => context, style:{}, dataset:{} }) };
}

test('固定 seed 的随机流可精确复放，且不同 seed 不混淆', async () => {
  installCanvasStub();
  const { clearRandomSeed, getRandomSeed, restartRandomSequence, rnd, setRandomSeed, visualIrnd, visualRnd } = await import('../src/core.js');
  const draw = () => Array.from({length:8}, () => Number(rnd(0, 1).toFixed(12)));

  assert.equal(setRandomSeed(20260901), 20260901);
  const first = draw();
  assert.equal(restartRandomSequence(), true);
  assert.deepEqual(draw(), first);
  assert.equal(setRandomSeed(20260902), 20260902);
  assert.notDeepEqual(draw(), first);
  assert.equal(getRandomSeed(), 20260902);
  restartRandomSequence();
  const beforeVisual = draw();
  restartRandomSequence();
  for(let i=0;i<200;i++) { visualRnd(-10,10); visualIrnd(0,5); }
  assert.deepEqual(draw(), beforeVisual, '视觉随机不得消耗玩法随机流');
  clearRandomSeed();
  assert.equal(getRandomSeed(), null);
});

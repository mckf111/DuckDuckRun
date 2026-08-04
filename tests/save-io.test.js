import test from 'node:test';
import assert from 'node:assert/strict';

test('普通拾取限频写入，强制冲刷与写入失败都可控', async () => {
  const writes = [];
  global.localStorage = {
    getItem(){ return null; },
    setItem(key, value){ writes.push([key, value]); },
  };
  const saves = await import('../src/save.js?io-test');
  saves.save.coins = 1;
  saves.queuePersist();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(writes.length, 1);

  saves.save.coins = 3;
  saves.queuePersist();
  saves.queuePersist();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(writes.length, 1);
  assert.equal(saves.flushSave(), true);
  assert.equal(writes.length, 2);

  global.localStorage.setItem = () => { throw new Error('quota'); };
  assert.doesNotThrow(() => saves.queuePersist());
  assert.equal(saves.flushSave(), false);
});

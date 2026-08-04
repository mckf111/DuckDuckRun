import test from 'node:test';
import assert from 'node:assert/strict';
import { runRhythmAudit } from '../tools/e2e/beam.mjs';

test('十关节奏：每关两段特色、同动作不超 2 次、高压后必有缓冲', async()=>{
  assert.deepEqual(await runRhythmAudit(12,1000),[]);
});

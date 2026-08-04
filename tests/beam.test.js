import test from 'node:test';
import assert from 'node:assert/strict';
import { runBeamAudit } from '../tools/e2e/beam.mjs';

test('Beam Search：200 个固定种子在最高速 500m 均有生还路径', async () => {
  const failed = await runBeamAudit(200, 500);
  assert.deepEqual(failed, []);
});

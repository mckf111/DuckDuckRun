import { runBeamAudit } from './beam.mjs';

const failed = await runBeamAudit(200, 500);
if(failed.length){
  console.error('FAIL | 最高速 500m 无生还路径 | seeds:', failed.join(','));
  process.exitCode = 1;
} else {
  console.log('PASS | 200 个固定种子 × 最高速 500m 均有生还路径');
}

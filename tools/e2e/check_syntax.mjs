import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const files=readdirSync(join(root,'src'),{recursive:true})
  .filter(file=>file.endsWith('.js')).map(file=>join(root,'src',file));
for(const file of files){
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){
    process.stderr.write(result.stderr||result.stdout);
    process.exit(result.status||1);
  }
}
console.log('PASS | 语法检查：'+files.length+' 个运行时模块');

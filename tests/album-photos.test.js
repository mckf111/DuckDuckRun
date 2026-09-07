import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {ALBUM_PHOTOS} from '../src/album-photos.js';
import {includeReleaseAsset} from '../tools/release_assets.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const records=JSON.parse(readFileSync(join(root,'assets/album/REVIEW.json'),'utf8'));

test('照片台账保留完整来源与证据哈希，衍生目录和署名不漂移',()=>{
 const result=spawnSync(process.execPath,['tools/sync_album_catalog.mjs','--check'],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.equal(Object.keys(records).length,40);
 for(const [id,r] of Object.entries(records)){
  assert.ok(r.queries.length>=2,id+' 必须记录别名检索');
  assert.equal(r.publicationReview,'pending','不能由代码伪造公开发布批准');
  if(!r.file){assert.ok(r.reason);assert.equal(r.kind,'missing');continue;}
  for(const key of ['visualReview','title','author','license','licenseUrl','sourceUrl','originalUrl','sourceTimestamp','sourceSha1','retrievedAt','changes'])assert.ok(r[key],id+' '+key);
  for(const key of ['sha256','downloadedSha256','sourceRecordSha256'])assert.match(r[key],/^[a-f0-9]{64}$/);
  const data=readFileSync(join(root,r.file));assert.equal(createHash('sha256').update(data).digest('hex'),r.sha256);
  // 检查 JPEG 头部段：EXIF/XMP、ICC、IPTC 与注释不得随运行照片发布。
  assert.equal(data.readUInt16BE(0),0xffd8);
  for(let offset=2;offset<data.length;){
   assert.equal(data[offset],0xff);const marker=data[offset+1];if(marker===0xda||marker===0xd9)break;
   assert.ok(![0xe1,0xe2,0xed,0xfe].includes(marker),id+' 含非必要嵌入元数据');
   offset+=2+data.readUInt16BE(offset+2);
  }
 }
});

test('当前图片一一入包，停用图鉴图片与原始候选记录不分发',()=>{
 const active=Object.values(ALBUM_PHOTOS).filter(p=>p.file).map(p=>p.file).sort();
 assert.deepEqual(readdirSync(join(root,'assets/album')).filter(n=>/\.jpg$/.test(n)).map(n=>'assets/album/'+n).sort(),active);
 for(const file of active)assert.equal(includeReleaseAsset(file),true);
 for(const file of readdirSync(join(root,'assets/img')).filter(n=>/^it_.*\.jpg$/.test(n)))assert.equal(includeReleaseAsset('assets/img/'+file),false);
 for(const path of ['assets/img/src','assets/img/src/raw.jpg','assets/img/CREDITS.json','assets/album/REVIEW.json'])assert.equal(includeReleaseAsset(path),false);
 assert.equal(includeReleaseAsset('assets/img/bg_zhonghua.jpg'),true,'保留仍被代码引用的背景后备');
});

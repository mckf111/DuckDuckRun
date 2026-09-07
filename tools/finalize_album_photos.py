#!/usr/bin/env python3
"""将逐张核验的候选与证据合并为可入库台账；公开发布状态仍为 pending。"""
import hashlib, json, shutil
from pathlib import Path
from research_album_photos import QUERIES

ROOT=Path(__file__).resolve().parent.parent
EVIDENCE=ROOT/'docs'/'album-review'
DEST=ROOT/'assets'/'album'

def main():
 choices=json.loads((ROOT/'tools'/'album_photo_choices.json').read_text(encoding='utf-8'))
 records={};DEST.mkdir(parents=True,exist_ok=True)
 for key,choice in choices.items():
  record={**choice,'queries':QUERIES[key],'publicationReview':'pending'}
  if choice.get('title'):
   assert choice.get('visualReview'),f'{key} 尚未记录人工/助手逐图核验结论'
   metadata=json.loads((EVIDENCE/(key+'-source.json')).read_text(encoding='utf-8'))
   assert metadata['title']==choice['title'],f'{key} 来源与候选不一致'
   image=EVIDENCE/'previews'/(key+'.jpg')
   assert hashlib.sha256(image.read_bytes()).hexdigest()==metadata['sha256']
   record.update({k:v for k,v in metadata.items() if k not in ('originalRecord','description','sourceSha256')})
   record['downloadedUrl']=metadata.get('downloadedUrl',metadata['originalUrl'])
   record['downloadedSha256']=metadata.get('downloadedSha256',metadata.get('sourceSha256'))
   record['licenseUrl']=record['licenseUrl'].replace('http://creativecommons.org/','https://creativecommons.org/')
   record['file']='assets/album/'+key+'.jpg'
   record['sourceRecordSha256']=hashlib.sha256((EVIDENCE/(key+'-source.json')).read_bytes()).hexdigest()
   record['licenseCheck']='source-verified; not a public-release approval'
   shutil.copyfile(image,ROOT/record['file'])
  else:
   assert choice.get('reason') and choice['reason']!='待核验',f'{key} 缺检索结论'
   record.update(file=None,kind='missing')
  records[key]=record
 (DEST/'REVIEW.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'台账 {len(records)} 项；采用 {sum(bool(r["file"]) for r in records.values())} 张；仍需公开发布审核。')

if __name__=='__main__':main()

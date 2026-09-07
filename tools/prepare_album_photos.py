#!/usr/bin/env python3
"""按已选原始文件制作本地候选，保留原图/许可证据；不自动批准公开发布。"""
import hashlib, html, io, json, re, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parent.parent
EVIDENCE=ROOT/'docs'/'album-review'
CHOICES=ROOT/'tools'/'album_photo_choices.json'
UA={'User-Agent':'JinlingRunPhotoResearch/1.0 (local asset source and license review)'}

def plain(value):return html.unescape(re.sub('<[^>]+>','',value)).strip()
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=35) as response:
  data=response.read(32*1024*1024+1)
  if len(data)>32*1024*1024:raise ValueError('素材超过 32 MiB，需单独检查')
  return data

def main():
 choices=json.loads(CHOICES.read_text(encoding='utf-8'))
 pool={}
 for path in EVIDENCE.glob('*-search.json'):
  for row in json.loads(path.read_text(encoding='utf-8')):
   pool.update({p['title']:p for p in row.get('response',{}).get('query',{}).get('pages',{}).values()})
 (EVIDENCE/'originals').mkdir(parents=True,exist_ok=True)
 (EVIDENCE/'previews').mkdir(exist_ok=True)
 for key,choice in choices.items():
  if not choice.get('title') or (len(sys.argv)>1 and key not in sys.argv[1:]):continue
  title=choice['title'];meta_path=EVIDENCE/(key+'-source.json')
  if meta_path.exists():
   metadata=json.loads(meta_path.read_text(encoding='utf-8'))
   if metadata['title']==title and metadata['width']>=choice.get('minWidth',0) and (EVIDENCE/'previews'/(key+'.jpg')).exists():continue
   history=EVIDENCE/'history'/key;history.mkdir(parents=True,exist_ok=True)
   (history/(metadata['sha256']+'.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
   previous=EVIDENCE/'previews'/(key+'.jpg')
   if previous.exists():(history/(metadata['sha256']+'.jpg')).write_bytes(previous.read_bytes())
  try:
   page=pool.get(title)
   if not page:
    params=dict(action='query',format='json',titles=title,prop='imageinfo|info',iiprop='url|extmetadata|sha1|size|timestamp',iiurlwidth=1280)
    data=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))
    page=next(iter(data.get('query',{}).get('pages',{}).values()),{})
    time.sleep(6)
   ii=page.get('imageinfo',[{}])[0]
   if '/thumb/' not in ii.get('thumburl','') and ii.get('width',0)>250:
    params=dict(action='query',format='json',titles=title,prop='imageinfo|info',iiprop='url|extmetadata|sha1|size|timestamp',iiurlwidth=500 if ii['width']>500 else 250)
    data=json.loads(get('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))
    page=next(iter(data.get('query',{}).get('pages',{}).values()),{})
    ii=page.get('imageinfo',[{}])[0];time.sleep(6)
   ext=ii.get('extmetadata',{})
   license=plain(ext.get('LicenseShortName',{}).get('value',''))
   if not re.fullmatch(r'CC BY(?:-SA)? (?:[1-4]\.0|2\.5)|CC0|Public domain',license):raise ValueError('需核查许可：'+license)
   # 遵从 Commons 限流响应：采用服务提供的标准缩略图，不反复拉取原图。
   url=ii.get('thumburl') or ii['url'];raw=get(url);sha=hashlib.sha256(raw).hexdigest()
   (EVIDENCE/'originals'/(key+Path(urllib.parse.urlparse(url).path).suffix.lower())).write_bytes(raw)
   source=Image.open(io.BytesIO(raw));image=ImageOps.exif_transpose(source).convert('RGB')
   image.thumbnail((1200,1200),Image.Resampling.LANCZOS)
   # 新建像素图，去除 EXIF/XMP/IPTC；不裁剪、不改色、不去水印。
   clean=Image.new('RGB',image.size);clean.paste(image)
   target=EVIDENCE/'previews'/(key+'.jpg');clean.save(target,'JPEG',quality=85,optimize=True,progressive=True)
   metadata=dict(title=title,author=plain(ext.get('Artist',{}).get('value','')),license=license,
    licenseUrl=ext.get('LicenseUrl',{}).get('value',''),sourceUrl=ii['descriptionurl'],
    originalUrl=ii['url'],downloadedUrl=url,sourceTimestamp=ii.get('timestamp'),sourceSha1=ii.get('sha1'),downloadedSha256=sha,
    retrievedAt=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
    width=clean.width,height=clean.height,changes=('采用 Commons 提供的缩略图；' if url!=ii['url'] else '')+'按 EXIF 方向旋转，等比缩至最长边不超过 1200px，JPEG 85 重编码并移除嵌入元数据；未裁剪、未改色。',
    description=plain(ext.get('ImageDescription',{}).get('value','')),originalRecord=page)
   meta_path.write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
   print(key,license,clean.size,flush=True);time.sleep(12)
  except urllib.error.HTTPError as error:
   print(key,str(error),flush=True)
   if error.code==429:raise SystemExit('限流：停止下载，保留已完成进度')
  except Exception as error:print(key,str(error),flush=True)

if __name__=='__main__':main()

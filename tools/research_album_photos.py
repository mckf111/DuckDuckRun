#!/usr/bin/env python3
"""只收集 Commons 原始记录供逐张核验；不会自动批准或替换运行素材。"""
import json, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'album-review'
QUERIES = {
 'duck':['盐水鸭','Nanjing salted duck'],
 'fans':['鸭血粉丝汤','duck blood vermicelli soup'],
 'tea':['雨花茶','Yuhua tea','Nanjing rain flower tea'],
 'taro':['糖芋苗','桂花糖芋苗','taro Nanjing'],
 'pot':['牛肉锅贴','Nanjing beef potstickers'],
 'bean':['赤豆元宵','red bean tangyuan Nanjing'],
 'cake':['梅花糕','plum blossom cake'],
 'root':['糖粥藕','糯米藕','lotus root glutinous rice'],
 'egg':['活珠子','Huozhuzi'],
 'bao':['南京 小笼包','Nanjing tangbao','Nanjing xiaolongbao'],
 'xiangdu':['南京香肚','Nanjing xiangdu','香肚'],
 'luhao':['芦蒿','Artemisia selengensis vegetable','Artemisia selengensis'],
 'wufan':['乌饭','乌米饭','Wumifan'],
 'zhuangyuan':['状元豆','Zhuangyuan beans'],
 'cloud':['南京云锦','Nanjing yunjin','Yunjin brocade'],
 'gold':['南京 金箔','Nanjing gold leaf','金箔 龙潭'],
 'lamp':['秦淮花灯','Qinhuai lantern'],
 'ronghua':['南京绒花','Nanjing velvet flower','Ronghua silk flower'],
 'zheshan':['金陵折扇','Nanjing folding fan'],
 'jianzhi':['南京剪纸','Nanjing paper cutting'],
 'kejing':['金陵刻经','Jinling Buddhist Press','Jinling sutra'],
 'baiju':['南京白局','Nanjing Baiju'],
 'elephant':['石象路','Ming Xiaoling stone elephant'],
 'book':['先锋书店 五台山','Librairie Avant-Garde Wutaishan'],
 'pibie':['六朝 石辟邪','Nanjing stone bixie','Southern dynasties bixie'],
 'wadang':['南京 人面瓦当','human face tile Nanjing','人面瓦当'],
 'chengzhuan':['南京 城砖 铭文','Nanjing wall brick inscription','Nanjing brick maker mark'],
 'nanyanjing':['南京眼','Nanjing Eye bridge'],
 'baoenta':['大报恩寺塔','Porcelain Tower Nanjing 2015'],
 'zifeng':['紫峰大厦','Zifeng Tower'],
 'baochuan':['郑和宝船 模型','Zheng He treasure ship model Nanjing'],
 'plum':['梅花山 梅花','Meihua Mountain plum blossom'],
 'sakura':['鸡鸣寺 樱花','Jiming Temple cherry blossom'],
 'leaf':['南京 法国梧桐 叶','Nanjing plane tree leaf','Platanus acerifolia leaf'],
 'stone':['雨花石','Yuhua stone'],
 'guihua':['桂花 南京','Osmanthus fragrans flowers'],
 'baige':['中山陵 音乐台 鸽子','Sun Yat-sen music stage pigeons','音乐台','Nanjing pigeons'],
 'yinghuo':['灵谷寺 萤火虫','Linggu Temple fireflies','Aquatica ficta'],
 'hufengdie':['中华虎凤蝶','Luehdorfia chinensis'],
 'jiangtun':['长江江豚','Neophocaena asiaeorientalis asiaeorientalis'],
}

def request(params):
 url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)
 req=urllib.request.Request(url,headers={'User-Agent':'JinlingRunPhotoResearch/1.0 (local asset source and license review)'})
 with urllib.request.urlopen(req,timeout=25) as response:return json.load(response)

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 for item,queries in QUERIES.items():
  path=OUT/(item+'-search.json')
  previous=json.loads(path.read_text(encoding='utf-8')) if path.exists() else []
  completed={r['query'] for r in previous if 'response' in r}
  if all(query in completed for query in queries):continue
  records=[r for r in previous if 'response' in r]
  for query in queries:
   if query in completed:continue
   params=dict(action='query',format='json',generator='search',gsrsearch=query+' filetype:bitmap',gsrnamespace=6,gsrlimit=8,
               prop='imageinfo',iiprop='url|extmetadata|sha1|size|timestamp',iiurlwidth=960)
   try:
    data=request(params)
    records.append({'query':query,'api':params,'response':data,'checked_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})
   except urllib.error.HTTPError as error:
    records.append({'query':query,'error':str(error)})
    if error.code==429:
     path.write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
     raise SystemExit('Commons 限流；保留已完成证据，停止请求，稍后或用原始页面核验。')
   except Exception as error:records.append({'query':query,'error':str(error)})
   time.sleep(6)
  path.write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
  titles=list(dict.fromkeys(p['title'] for r in records for p in r.get('response',{}).get('query',{}).get('pages',{}).values()))
  print(item, len(titles), ' | '.join(titles[:4]),flush=True)

if __name__=='__main__':main()

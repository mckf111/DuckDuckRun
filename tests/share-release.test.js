import test from 'node:test';
import assert from 'node:assert/strict';

function installBrowserStubs(){
  if(!globalThis.navigator) Object.defineProperty(globalThis, 'navigator', {value:{userAgent:'node-test'}, configurable:true});
  globalThis.localStorage = {getItem:() => null, setItem:() => {}};
  const context = {setTransform(){}};
  const canvas = {getContext:() => context, style:{}, dataset:{}};
  globalThis.document = {getElementById:id => id === 'cv' ? canvas : null};
  globalThis.window = {devicePixelRatio:1};
}

installBrowserStubs();
const { buildShareCopy, resolveShareLink } = await import('../src/share.js?release-contract-test');

test('生产分享地址使用构建注入的稳定站点根入口', () => {
  const current = {href:'https://cdn.example/releases/deadbeef/?slice=1#share'};
  assert.equal(resolveShareLink({publicSiteUrl:'https://play.example', publicBasePath:'/DuckDuckRun'}, current), 'https://play.example/DuckDuckRun/');
  assert.equal(resolveShareLink({publicSiteUrl:'https://play.example/', publicBasePath:''}, current), 'https://play.example/');
});

test('未注入配置时剥离版本目录、查询参数和深链', () => {
  assert.equal(
    resolveShareLink({}, {href:'http://127.0.0.1:8000/DuckDuckRun/releases/abc123/?slice=1#lv0'}),
    'http://127.0.0.1:8000/DuckDuckRun/',
  );
  assert.equal(resolveShareLink({}, {href:'http://127.0.0.1:8000/index.html?demo=1'}), 'http://127.0.0.1:8000/');
});

test('南京切片分享卡使用切片名称与灯牌，不冒充主线成绩', () => {
  const copy = buildShareCopy({
    dist:720, marks:9, stars:3, endless:false, slice:true, levelName:'明城墙', albumN:40,
    tokens:4, easy:true, routeName:'月影左线',
  }, {best:3000,totalStars:30}, 'https://play.example/');
  assert.match(copy.title, /中华门·秦淮夜渡 · 720 m/);
  assert.match(copy.sub, /轻松模式 · 灯牌 4 枚 · 月影左线/);
  assert.match(copy.text, /灯牌/);
  assert.doesNotMatch([copy.title, copy.sub, copy.text].join('\n'), /明城墙|鸭蛋|图鉴|\d+\s*星/);
  assert.equal(copy.footer, '南京夜跑切片 · 独立试玩，不计主线星级');
});

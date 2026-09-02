import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

if(!process.env.CHROME_LOG_FILE) process.env.CHROME_LOG_FILE = join(tmpdir(), 'duckduckrun-release-chromium.log');

export const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

function pythonCandidates(){
  const preferred = (process.env.PYTHON || '').trim();
  const defaults = process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
  return [...new Set([preferred, ...defaults].filter(Boolean))];
}

async function stopChild(child){
  if(!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(resolveExit => child.once('exit', resolveExit));
  child.kill();
  await Promise.race([exited, sleep(1500)]);
}

export async function startStaticServer({cwd, port, label='发布测试', probePath='/build-info.json'}){
  const base = `http://127.0.0.1:${port}`;
  const attempts = [];
  for(const command of pythonCandidates()){
    let spawnError = null;
    let stderr = '';
    const child = spawn(command, ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {
      cwd,
      stdio:['ignore', 'ignore', 'pipe'],
      windowsHide:true,
    });
    child.once('error', error => { spawnError = error; });
    child.stderr?.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-2000); });

    let ready = false;
    for(let index=0; index<60; index++){
      if(spawnError || child.exitCode !== null || child.signalCode !== null) break;
      try{
        const response = await fetch(base + probePath, {cache:'no-store'});
        if(response.ok){
          await response.arrayBuffer();
          ready = true;
          break;
        }
      }catch(error){}
      await sleep(100);
    }
    if(ready){
      return {
        base,
        command,
        process:child,
        stop:() => stopChild(child),
      };
    }

    await stopChild(child);
    const reason = spawnError?.message || stderr.trim() || `进程提前退出（exit=${child.exitCode}, signal=${child.signalCode}）`;
    attempts.push(`${command}: ${reason}`);
  }
  throw new Error(`${label}静态服务未启动；已尝试 ${attempts.join('；')}`);
}

export function releaseEvidenceDir(root){
  if(process.env.RELEASE_EVIDENCE_DIR) return resolve(process.env.RELEASE_EVIDENCE_DIR);
  const workspace = createHash('sha256').update(resolve(root)).digest('hex').slice(0, 10);
  return join(tmpdir(), 'duckduckrun-release-evidence', workspace);
}

export function ensureEvidenceDir(root){
  const directory = releaseEvidenceDir(root);
  mkdirSync(directory, {recursive:true});
  return directory;
}

export function browserExecutable(){
  return process.env.PLAYWRIGHT_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
}

export function attachPageErrors(page, errors){
  page.on('pageerror', error => errors.push(`pageerror:${error.message}`));
  page.on('console', message => { if(message.type() === 'error') errors.push(`console:${message.text()}`); });
  page.on('requestfailed', request => errors.push(`request:${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if(response.status() >= 400) errors.push(`http:${response.status()} ${response.url()}`); });
}

export async function waitForReleaseFrame(page, {state, minimumStateTime=0.35, timeout=5000}={}){
  await page.evaluate(() => document.fonts.ready);
  if(state){
    await page.waitForFunction(async ({expectedState, minimum}) => {
      const game = await import('./src/game.js');
      return game.G.state === expectedState && game.G.stateT >= minimum && document.fonts.status === 'loaded';
    }, {expectedState:state, minimum:minimumStateTime}, {timeout});
  }
  await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
}

export function assertReleaseGlyphManifest(root, samples){
  const manifest = readFileSync(join(root, 'assets', 'fonts', 'chars.txt'), 'utf8').replace(/^\uFEFF/, '');
  const missing = [...new Set(samples.join('').replace(/\s/g, ''))].filter(character => !manifest.includes(character));
  assert.deepEqual(missing, [], `JinlingKai 字体子集缺少发布关键字：${missing.join(' ')}`);
}

export async function assertBrowserGlyphCoverage(page, samples, fontFamily='JinlingKai'){
  const text = [...new Set(samples.join('').replace(/\s/g, ''))].join('');
  await page.evaluate(async ({family, sample}) => {
    await document.fonts.load(`52px "${family}"`, sample);
    await document.fonts.ready;
  }, {family:fontFamily, sample:text});
  const missing = await page.evaluate(({family, sample}) => {
    const render = (font, character) => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext('2d');
      context.fillStyle = '#000';
      context.font = font;
      context.textBaseline = 'alphabetic';
      context.fillText(character, 8, 68);
      return context.getImageData(0, 0, 96, 96).data;
    };
    const samePixels = (left, right) => {
      if(left.length !== right.length) return false;
      for(let index=0; index<left.length; index++) if(left[index] !== right[index]) return false;
      return true;
    };
    return [...sample].filter(character => {
      const preferred = render(`52px "${family}", "__DuckMissingFamily__", monospace`, character);
      const fallback = render('52px "__DuckMissingFamily__", monospace', character);
      return samePixels(preferred, fallback);
    });
  }, {family:fontFamily, sample:text});
  assert.deepEqual(missing, [], `${fontFamily} 实际 woff2 缺少发布关键字：${missing.join(' ')}`);
}

export async function sampleJsHeap(cdp, count=3){
  const samples = [];
  await cdp.send('HeapProfiler.enable');
  for(let index=0; index<count; index++){
    await cdp.send('HeapProfiler.collectGarbage');
    await sleep(80);
    const usage = await cdp.send('Runtime.getHeapUsage');
    samples.push(usage.usedSize);
  }
  const sorted = [...samples].sort((left, right) => left - right);
  return {samples, median:sorted[Math.floor(sorted.length / 2)]};
}

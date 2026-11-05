/* ==========================================================
   inspect.mjs —— 《放課後ソーダ》Lexmount 云端浏览器自动巡检
   可复跑：node inspect.mjs [--base <线上地址>] [--out <输出目录>]

   凭证来源（按优先级）：
     1. 环境变量 LEXMOUNT_PROJECT_ID / LEXMOUNT_API_KEY / LEXMOUNT_API_BASE_URL
     2. browser-cli 登录后的本地凭据文件 ~/.config/lexmount/browser-cli/credentials.json
   密钥只在进程内使用，不打印、不落盘、不提交。

   检查项：
     T1 标题页加载          T2 运行时错误钩子
     T3 BGM 真实播放        T4 配音 wav 加载
     T5 三选一选择支        T6 三个结局可达
     T7 split/wave 版式     T8 记录面板回归（含旁白）
     T9 全程零资源/JS 错误
   退出码：全部通过 0，任何失败 1（可接 CI）。
   ========================================================== */

import { Lexmount } from 'lexmount';
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/* ---------------- 参数与凭证 ---------------- */
const args = process.argv.slice(2);
const argOf = (flag, dft) => {
  const i = args.indexOf(flag);
  return i > -1 ? args[i + 1] : dft;
};
const BASE = argOf('--base', 'https://hatsunemiku2118.github.io/HatsuneMiku2118');
const OUT = path.resolve(argOf('--out', './out'));

function loadCreds() {
  if (process.env.LEXMOUNT_API_KEY && process.env.LEXMOUNT_PROJECT_ID) {
    return {
      apiKey: process.env.LEXMOUNT_API_KEY,
      projectId: process.env.LEXMOUNT_PROJECT_ID,
      baseUrl: process.env.LEXMOUNT_API_BASE_URL || 'https://api.browser.lexmount.cn'
    };
  }
  const f = path.join(os.homedir(), '.config', 'lexmount', 'browser-cli', 'credentials.json');
  if (!fs.existsSync(f)) throw new Error('缺少 Lexmount 凭证：先跑 browser-cli auth login，或设置环境变量');
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  return { apiKey: j.api_key, projectId: j.project_id, baseUrl: j.api_base_url };
}
const creds = loadCreds();

/* ---------------- 结果收集 ---------------- */
const results = [];
const errBank = [];
let drain = async () => { };   /* 每个检查项结束后收割当前页错误（导航会重置页内列表） */
const t0 = Date.now();
async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    await drain();
    results.push({ name, status: 'PASS', detail, ms: Date.now() - started });
    console.log(`PASS  ${name}  ${detail ? '· ' + detail : ''}`);
  } catch (e) {
    await drain().catch(() => { });
    results.push({ name, status: 'FAIL', detail: String(e.message || e), ms: Date.now() - started });
    console.log(`FAIL  ${name}  · ${String(e.message || e)}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ---------------- 主流程 ---------------- */
fs.mkdirSync(OUT, { recursive: true });
console.log(`目标: ${BASE}\n`);

const client = new Lexmount({ apiKey: creds.apiKey, projectId: creds.projectId, baseUrl: creds.baseUrl });
const session = await client.sessions.create({ windowSize: '1280,720' });
console.log(`云端会话: ${session.id} @ ${session.regionId}\n`);

const browser = await chromium.connectOverCDP(session.connectUrl);

try {
  const context = browser.contexts()[0] ?? await browser.newContext();
  const page = context.pages()[0] ?? await context.newPage();

  /* T2: 每次页面加载都注入错误钩子（资源失败 + JS 错误），跨导航累计 */
  await page.addInitScript(() => {
    window.__ERRS = (window.__ERRS || []).concat([]);
    window.addEventListener('error', (e) => {
      const t = e.target;
      if (t !== window && (t.src || t.href)) window.__ERRS.push('resource: ' + (t.src || t.href));
      else window.__ERRS.push('js: ' + String(e.message));
    }, true);
  });

  const drainErrs = async () => {
    const e = await page.evaluate(() => window.__ERRS || []);
    errBank.push(...e);
    await page.evaluate(() => { window.__ERRS = []; });
  };
  drain = drainErrs;

  /* T1 标题页 */
  await check('T1 标题页加载', async () => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#titleScreen.on', { timeout: 30_000 });
    const title = await page.textContent('.titleJp');
    assert(title === '放課後ソーダ', '标题文本不符: ' + title);
    await page.screenshot({ path: path.join(OUT, 's1_title.png') });
    return 'titleScreen.on 就绪';
  });

  /* T3 BGM 真实播放：currentTime 必须递增。
     云端区域到 GitHub Pages 的带宽有波动，mp3 起播可能需数秒缓冲，故轮询最多 10s。 */
  await check('T3 BGM 播放（calm）', async () => {
    await page.click('#btnStart');
    await page.waitForSelector('#chapterCard.on');
    await page.click('#stage');
    let a = null, b = null;
    for (let i = 0; i < 12; i++) {
      await sleep(900);
      a = await page.evaluate(() => BGM.state);
      if (!a || a.key !== 'calm' || a.paused) throw new Error('BGM 未进入播放态: ' + JSON.stringify(a));
      await sleep(900);
      b = await page.evaluate(() => BGM.state);
      if (b.time > a.time) break;
      a = null; /* 继续等缓冲 */
    }
    assert(a && b && b.time > a.time, `10s 内 currentTime 未递增（可能是云端区域到站点带宽不足）: ${JSON.stringify(b)}`);
    return `calm ${a.time.toFixed(1)}s → ${b.time.toFixed(1)}s, vol=${b.volume}`;
  });

  /* T4 配音加载：推进到第一句 vo，检查 resource timing */
  await check('T4 配音 wav 加载', async () => {
    for (let i = 0; i < 7; i++) { await page.click('#stage'); await sleep(600); }
    const wavs = await page.evaluate(() =>
      performance.getEntriesByType('resource').filter(r => /\.wav/.test(r.name)).map(r => r.name.split('/').pop()));
    assert(wavs.includes('c1_room_12.wav'), '未加载 c1_room_12.wav: ' + JSON.stringify(wavs));
    await page.screenshot({ path: path.join(OUT, 's2_dialogue.png') });
    return wavs.join(',');
  });

  /* T5 选择支渲染 */
  await check('T5 烟花三选一', async () => {
    await page.goto(BASE + '/?scene=c4_fireworks&i=15', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#choices.on', { timeout: 30_000 });
    const n = await page.locator('#choices button').count();
    assert(n === 3, '选项数量: ' + n);
    await page.screenshot({ path: path.join(OUT, 's3_choice.png') });
    return '3 个选项';
  });

  /* T6 三个结局可达（含真实点击选项 → 告白线） */
  await check('T6 结局可达 ×3', async () => {
    const seen = [];
    /* 真实点击第一个选项，推进到 END 01 */
    await page.click('#choices button:nth-child(1)');
    for (let i = 0; i < 14; i++) {
      if (await page.evaluate(() => document.getElementById('endingScreen').classList.contains('on'))) break;
      await page.click('#stage'); await sleep(400);
    }
    await page.waitForSelector('#endingScreen.on', { timeout: 20_000 });
    seen.push(await page.textContent('#endNo'));
    await page.screenshot({ path: path.join(OUT, 's4_ending1.png') });
    /* 另两个结局用调试直达 */
    for (const [scene, i, no] of [['c4_wait', 15, 'END 02'], ['c4_foam', 20, 'END 03']]) {
      await page.goto(`${BASE}/?scene=${scene}&i=${i}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#endingScreen.on', { timeout: 20_000 });
      const got = await page.textContent('#endNo');
      assert(got.trim() === no, `${scene} 结局编号 ${got} ≠ ${no}`);
      seen.push(got);
    }
    await page.screenshot({ path: path.join(OUT, 's5_ending3.png') });
    return seen.join(', ');
  });

  /* T7 版式：split 左立绘右面板；wave 无立绘 */
  await check('T7 split/wave 版式', async () => {
    await page.goto(BASE + '/?scene=c2_roof&i=14', { waitUntil: 'domcontentloaded' });
    await sleep(1200);
    const split = await page.evaluate(() => ({
      ui: document.getElementById('stage').dataset.ui,
      charLeft: Math.round(document.getElementById('charL').getBoundingClientRect().left),
      textRight: Math.round(document.getElementById('textBody').getBoundingClientRect().right)
    }));
    assert(split.ui === 'split', 'c2_roof 版式: ' + split.ui);
    assert(split.charLeft < 400 && split.textRight > 700, `split 几何异常: ${JSON.stringify(split)}`);
    await page.screenshot({ path: path.join(OUT, 's6_split.png') });

    await page.goto(BASE + '/?scene=c1_road&i=6', { waitUntil: 'domcontentloaded' });
    await sleep(1000);
    const wave = await page.evaluate(() => document.getElementById('stage').dataset.ui);
    assert(wave === 'wave', 'c1_road 版式: ' + wave);
    await page.screenshot({ path: path.join(OUT, 's7_wave.png') });
    return `split(charL=${split.charLeft}) + wave`;
  });

  /* T8 记录面板回归：真实推进后旁白必须在记录里（修复的缺陷） */
  await check('T8 记录含旁白（回归）', async () => {
    await page.goto(BASE + '/?scene=c1_room&i=0', { waitUntil: 'domcontentloaded' });
    await sleep(800);
    for (let i = 0; i < 5; i++) { await page.click('#stage'); await sleep(450); }
    await page.click('#btnLog');
    await sleep(300);
    const n = await page.locator('#logBody > p').count();
    assert(n >= 4, `记录只有 ${n} 条（旁白未入记录 → 缺陷复发）`);
    await page.screenshot({ path: path.join(OUT, 's8_log.png') });
    return n + ' 条';
  });

  /* T9 全程零错误 */
  await check('T9 零资源/JS 错误', async () => {
    await drainErrs();
    assert(errBank.length === 0, '捕获到错误: ' + errBank.join(' | '));
    return '0 错误';
  });
} finally {
  await browser.close().catch(() => { });
  await session.close().catch(() => { });
  client.close();
}

/* ---------------- 输出 ---------------- */
const passed = results.filter(r => r.status === 'PASS').length;
const summary = {
  base: BASE, session_id: session.id, region: session.regionId, inspect_url: session.inspectUrl,
  at: new Date().toISOString(), duration_ms: Date.now() - t0,
  passed, failed: results.length - passed, results
};
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(summary, null, 2));

let md = `# 自动巡检结果\n\n- 目标：${BASE}\n- 云端会话：${session.id}（${session.regionId}）\n- 时间：${summary.at}　用时：${(summary.duration_ms / 1000).toFixed(1)}s\n- 结论：**${passed}/${results.length} PASS**${summary.failed ? '，' + summary.failed + ' FAIL' : ''}\n\n| 检查项 | 结果 | 详情 |\n| --- | --- | --- |\n`;
for (const r of results) md += `| ${r.name} | ${r.status} | ${r.detail} |\n`;
md += `\n截图见本目录 \`s*.png\`。复跑：\`node inspect.mjs\`（需 Lexmount 凭证，见脚本头注释）。\n`;
fs.writeFileSync(path.join(OUT, 'RESULTS.md'), md);

console.log(`\n==== ${passed}/${results.length} PASS，用时 ${(summary.duration_ms / 1000).toFixed(1)}s，结果已写入 ${OUT} ====`);
process.exit(summary.failed ? 1 : 0);

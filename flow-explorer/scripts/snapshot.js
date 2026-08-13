#!/usr/bin/env node
/**
 * flow-explorer 流程图快照脚本
 *
 * 把生成的交互流程图 HTML 渲染成高清 PNG，供插入飞书文档等
 * 不能执行 JS 的载体。视口高度按流程图实际宽高比自动计算。
 *
 * 用法：
 *   node snapshot.js <flow.html> <输出目录> [选项]
 *
 * 选项：
 *   --width N        截图宽度，默认 1920
 *   --scale N        设备像素比（清晰度倍数），默认 2
 *   --cards          额外输出分阶段卡片视图 cards.png
 *   --mermaid <路径> 离线环境用本地 mermaid.min.js 替代 CDN
 *
 * 依赖：npm i playwright-core（以及可用的 Chromium，
 *       环境变量 CHROMIUM_PATH 可指定浏览器路径）
 */
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const candidates = ['playwright-core', 'playwright'];
  const searchPaths = [process.cwd(), __dirname];
  for (const name of candidates) {
    try { return require(name); } catch (e) { /* 继续 */ }
    try { return require(require.resolve(name, { paths: searchPaths })); } catch (e) { /* 继续 */ }
  }
  console.error('缺少依赖：请先执行 npm i playwright-core');
  process.exit(1);
}

function chromiumPath() {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const known = '/opt/pw-browsers/chromium';
  if (fs.existsSync(known)) return known;
  return undefined; // 交给 playwright 自己解析已安装的浏览器
}

function parseArgs(argv) {
  const args = { width: 1920, scale: 2, cards: false, mermaid: null, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--width') args.width = parseInt(argv[++i], 10);
    else if (a === '--scale') args.scale = parseFloat(argv[++i]);
    else if (a === '--cards') args.cards = true;
    else if (a === '--mermaid') args.mermaid = path.resolve(argv[++i]);
    else args.positional.push(a);
  }
  return args;
}

(async () => {
  const { chromium } = loadPlaywright();
  const args = parseArgs(process.argv.slice(2));
  if (args.positional.length < 1) {
    console.error('用法：node snapshot.js <flow.html> [输出目录] [--width N] [--scale N] [--cards] [--mermaid <路径>]');
    process.exit(1);
  }
  const htmlPath = path.resolve(args.positional[0]);
  const outDir = path.resolve(args.positional[1] || '.');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: args.width, height: 1080 },
    deviceScaleFactor: args.scale,
  });
  const page = await context.newPage();

  if (args.mermaid) {
    const body = fs.readFileSync(args.mermaid, 'utf-8');
    await page.route('**/cdn.jsdelivr.net/**', (r) =>
      r.fulfill({ contentType: 'application/javascript', body }));
  }

  page.on('pageerror', (e) => { console.error('页面 JS 错误：', String(e)); });

  await page.goto('file://' + htmlPath);
  await page.waitForSelector('#stage svg', { timeout: 20000 });
  await page.waitForTimeout(500);

  // 按流程图实际宽高比调整视口高度，避免宽图被压扁或竖图截不全
  const ratio = await page.evaluate(() => {
    const svg = document.querySelector('#stage svg');
    const bb = svg.getBBox();
    return bb.width > 0 ? bb.height / bb.width : 1;
  });
  const height = Math.max(700, Math.min(2600, Math.round((args.width - 80) * ratio) + 200));
  await page.setViewportSize({ width: args.width, height });
  await page.click('#z-fit');
  await page.waitForTimeout(400);

  // 隐藏缩放控件等纯交互元素，快照只留图
  await page.addStyleTag({ content: '.zoom-ctrl { display: none !important; }' });

  const flowPng = path.join(outDir, 'flow.png');
  await page.locator('#viewport').screenshot({ path: flowPng });
  console.log('已输出：' + flowPng + `（${args.width}x${height} @${args.scale}x）`);

  if (args.cards) {
    await page.click('.tab[data-view="cards"]');
    await page.waitForTimeout(400);
    const cardsPng = path.join(outDir, 'cards.png');
    await page.locator('#cards').screenshot({ path: cardsPng });
    console.log('已输出：' + cardsPng);
  }

  await browser.close();
})().catch((e) => { console.error('快照失败：', e); process.exit(1); });

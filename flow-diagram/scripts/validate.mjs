/* 无浏览器依赖的交付前校验。
   用法：node scripts/validate.mjs <生成的.html>
   只验证 HTML、数据区和内嵌 JS 语法；不因 Playwright/浏览器不可用而阻断交付。 */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const file = process.argv[2];
if (!file) { console.error('用法：node scripts/validate.mjs <生成的.html>'); process.exit(2); }
const html = await readFile(resolve(file), 'utf8');
const errors = [];
if (!/^\s*<!doctype html>/i.test(html)) errors.push('缺少 HTML5 doctype');
if (!/<html[\s>]/i.test(html) || !/<\/html>/i.test(html)) errors.push('HTML 根节点不完整');
if (!/id=["']exportImageBtn["']/.test(html)) errors.push('缺少“导出高清 PNG”按钮');
if (!/function\s+exportHighResPng\s*\(/.test(html)) errors.push('缺少高清 PNG 导出函数');
if (!/function\s+buildNativeExportSvg\s*\(/.test(html)) errors.push('导出器不是原生 SVG 实现');
if (!/var\s+DEFAULT\s*=\s*\{/.test(html)) errors.push('缺少流程数据 DEFAULT');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
if (!scripts.length) errors.push('没有内嵌脚本');
const dir = await mkdtemp(join(tmpdir(), 'flow-diagram-check-'));
try {
  for (let i = 0; i < scripts.length; i++) {
    const scriptFile = join(dir, 'script-' + i + '.js');
    await writeFile(scriptFile, scripts[i]);
    const checked = spawnSync(process.execPath, ['--check', scriptFile], { encoding: 'utf8' });
    if (checked.status !== 0) errors.push('内嵌脚本语法错误：' + (checked.stderr || checked.stdout).trim());
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (errors.length) {
  console.error('❌ 校验失败：\n' + errors.join('\n'));
  process.exit(1);
}
console.log('✅ 校验通过：HTML 结构、流程数据、原生 PNG 导出器与内嵌 JS 语法均正常。');

/**
 * 一次打包、批量出图。用于渲染整片前快速核对关键帧画面。
 * 用法: node scripts/stills.mjs 60 250 470
 */
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const COMP_ID = 'AllTerrainMode';

const frames = process.argv.slice(2).map(Number);
if (frames.length === 0) {
	console.error('请传入要渲染的帧号');
	process.exit(1);
}

console.log('打包中…');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});

const composition = await selectComposition({
	serveUrl,
	id: COMP_ID,
	browserExecutable: BROWSER,
});
console.log(`合成: ${composition.width}x${composition.height} ${composition.fps}fps ${composition.durationInFrames}帧`);

for (const frame of frames) {
	const output = path.resolve(`out/still-${String(frame).padStart(4, '0')}.png`);
	await renderStill({
		composition,
		serveUrl,
		output,
		frame,
		imageFormat: 'png',
		browserExecutable: BROWSER,
		chromiumOptions: {gl: 'angle'},
		overwrite: true,
	});
	console.log('已输出', output);
}

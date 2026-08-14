/**
 * 渲染整片。容器里没有 Remotion 自带的浏览器，
 * 指定 Playwright 预装的 headless_shell（完整版 Chrome 已移除旧版 headless 模式）。
 */
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const COMP_ID = 'AllTerrainMode';
const OUT = path.resolve('out/all-terrain-mode.mp4');

console.log('打包中…');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});

const composition = await selectComposition({
	serveUrl,
	id: COMP_ID,
	browserExecutable: BROWSER,
});

const total = composition.durationInFrames;
console.log(
	`渲染 ${composition.width}x${composition.height} ${composition.fps}fps ${total}帧 (${(
		total / composition.fps
	).toFixed(1)}s)`,
);

let last = -1;
await renderMedia({
	composition,
	serveUrl,
	codec: 'h264',
	outputLocation: OUT,
	browserExecutable: BROWSER,
	chromiumOptions: {gl: 'angle'},
	crf: 18,
	concurrency: 4,
	overwrite: true,
	onProgress: ({renderedFrames}) => {
		const pct = Math.floor((renderedFrames / total) * 100);
		if (pct >= last + 10) {
			last = pct;
			console.log(`  ${pct}%  (${renderedFrames}/${total})`);
		}
	},
});

console.log('完成:', OUT);

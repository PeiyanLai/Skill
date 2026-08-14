import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * 字体必须在第一帧之前就绪，否则渲染出的帧会混用 fallback 字体。
 * 用 delayRender 阻塞渲染直到 FontFace 全部 load 完成。
 *
 * public/fonts 下是裁剪过的子集（见 scripts/subset-fonts.py），每个字重约 64KB。
 * 直接用 @fontsource 的完整简体子集（每个 1.1MB）会在多进程渲染时反复超时。
 */
const WEIGHTS = [400, 500, 700] as const;

const handle = delayRender('加载 Noto Sans SC 字体', {
	timeoutInMilliseconds: 120000,
});

const faces = WEIGHTS.map((weight) => {
	const url = staticFile(`fonts/noto-sans-sc-${weight}.woff2`);
	const face = new FontFace('Noto Sans SC', `url(${url}) format('woff2')`, {
		weight: String(weight),
		display: 'block',
	});
	return face.load().then((loaded) => {
		document.fonts.add(loaded);
	});
});

Promise.all(faces)
	.then(() => continueRender(handle))
	.catch((err) => {
		// 字体失败不应让整条片子渲染中断，退回系统中文字体继续渲染
		console.error('字体加载失败，回退系统字体：', err);
		continueRender(handle);
	});

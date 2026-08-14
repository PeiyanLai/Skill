import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../theme';

/**
 * 方向盘 + 左侧多功能按键。pressAt 指定第几帧「按下」，
 * 按下后按键点亮并向外扩散两圈光环。
 */
export const SteeringWheel: React.FC<{pressAt: number; width?: number}> = ({
	pressAt,
	width = 760,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const enter = spring({fps, frame, config: {damping: 200}});
	const pressT = frame - pressAt;
	const pressed = pressT >= 0;

	// 按下瞬间按键下沉
	const keyScale = pressed
		? interpolate(pressT, [0, 3, 12], [1, 0.88, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 1;

	// 按下前的呼吸提示
	const hint = pressed
		? 1
		: interpolate(Math.sin((frame / fps) * 4), [-1, 1], [0.35, 1]);

	const keyGlow = pressed ? 1 : hint * 0.55;

	// 两圈依次扩散的光环。半径刻意收窄，否则会形成一个与轮圈争夺注意力的大圆
	const rings = [0, 10].map((delay) => {
		const t = pressed
			? interpolate(pressT - delay, [0, 30], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				})
			: 0;
		return {delay, r: 24 + t * 58, o: t === 0 ? 0 : (1 - t) * 0.75};
	});

	return (
		<svg
			width={width}
			height={width * 0.86}
			viewBox="0 0 600 516"
			fill="none"
			style={{
				opacity: enter,
				transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
			}}
		>
			{/* 外圈 */}
			<circle
				cx="300"
				cy="258"
				r="218"
				stroke={C.panelLine}
				strokeWidth="26"
				opacity={0.9}
			/>
			<circle cx="300" cy="258" r="218" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />

			{/* 轮辐 */}
			<rect x="104" y="241" width="122" height="34" rx="17" fill="rgba(255,255,255,0.07)" />
			<rect x="374" y="241" width="122" height="34" rx="17" fill="rgba(255,255,255,0.07)" />
			<rect x="282" y="316" width="36" height="126" rx="18" fill="rgba(255,255,255,0.07)" />

			{/* 中央气囊盖 */}
			<rect
				x="214"
				y="204"
				width="172"
				height="110"
				rx="38"
				fill="rgba(255,255,255,0.06)"
				stroke={C.panelLine}
				strokeWidth="2"
			/>

			{/* 按下扩散的光环 */}
			{rings.map((r) => (
				<circle
					key={r.delay}
					cx="166"
					cy="258"
					r={r.r}
					stroke={C.accent2}
					strokeWidth="2.5"
					opacity={r.o}
				/>
			))}

			{/* 多功能按键 */}
			<g transform={`translate(166 258) scale(${keyScale}) translate(-166 -258)`}>
				<rect
					x="136"
					y="243"
					width="60"
					height="30"
					rx="10"
					fill={pressed ? C.accent : `rgba(0,190,190,${0.18 + keyGlow * 0.5})`}
					stroke={C.accent2}
					strokeWidth="2"
					opacity={pressed ? 1 : 0.5 + keyGlow * 0.5}
				/>
				{/* 键面上的地形指示纹 */}
				<path
					d="M148 260c3.5-3 6-3 9.5 0s6 3 9.5 0 6-3 9.5 0"
					stroke={pressed ? '#00201F' : C.accent2}
					strokeWidth="2.2"
					strokeLinecap="round"
					fill="none"
				/>
			</g>
		</svg>
	);
};

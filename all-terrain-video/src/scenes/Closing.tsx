import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Ground} from '../components/Ground';
import {Scrim} from '../components/Scrim';
import {C, FONT, byId} from '../theme';

const SUMMARY = [
	{no: '01', title: '自动识别与提醒', desc: '驶入对应地形，系统主动询问是否开启'},
	{no: '02', title: '便捷激活', desc: '方向盘按键一键进入，手不离方向盘'},
	{no: '03', title: '场景切换识别', desc: '路面变化实时识别，主动提醒切换模式'},
];

/** 收尾：三项核心能力回顾 */
export const Closing: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const title = spring({fps, frame: frame - 4, config: {damping: 200}});
	const tail = spring({fps, frame: frame - 74, config: {damping: 200}});

	const out = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				background: C.bg,
				fontFamily: FONT,
				opacity: out,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Ground terrain={byId('gravel')} speed={0.5} opacity={0.42} seed="close" />
			<Scrim strength={0.8} cy={0.5} size="60% 48%" />

			{/* 标题 */}
			<div
				style={{
					position: 'absolute',
					top: 148,
					textAlign: 'center',
					opacity: title,
					transform: `translateY(${interpolate(title, [0, 1], [24, 0])}px)`,
				}}
			>
				<div style={{fontSize: 22, letterSpacing: 14, color: C.accent2, fontWeight: 500}}>
					ALL-TERRAIN MODE
				</div>
				<div
					style={{
						marginTop: 16,
						fontSize: 82,
						fontWeight: 700,
						color: C.text,
						letterSpacing: 8,
					}}
				>
					全地形模式
				</div>
			</div>

			{/* 三项核心能力 */}
			<div style={{display: 'flex', gap: 30, marginTop: 78}}>
				{SUMMARY.map((s, i) => {
					const sp = spring({fps, frame: frame - 20 - i * 10, config: {damping: 200}});
					return (
						<div
							key={s.no}
							style={{
								width: 470,
								height: 300,
								borderRadius: 24,
								background: C.panel,
								border: `1px solid ${C.panelLine}`,
								padding: '40px 38px',
								opacity: sp,
								transform: `translateY(${interpolate(sp, [0, 1], [44, 0])}px)`,
							}}
						>
							<div
								style={{
									fontSize: 46,
									fontWeight: 700,
									color: C.accent2,
									letterSpacing: 2,
								}}
							>
								{s.no}
							</div>
							<div
								style={{
									marginTop: 20,
									fontSize: 40,
									fontWeight: 700,
									color: C.text,
									letterSpacing: 3,
								}}
							>
								{s.title}
							</div>
							<div
								style={{
									marginTop: 18,
									fontSize: 25,
									lineHeight: 1.6,
									color: C.text3,
									letterSpacing: 1,
								}}
							>
								{s.desc}
							</div>
						</div>
					);
				})}
			</div>

			{/* 地形一览 */}
			<div
				style={{
					position: 'absolute',
					bottom: 128,
					fontSize: 30,
					letterSpacing: 12,
					color: C.text2,
					opacity: tail,
				}}
			>
				泥地 · 沙地 · 雪地 · 湿地 · 碎石
			</div>
		</AbsoluteFill>
	);
};

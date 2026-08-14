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

/** 开场：标题遮罩上推 + 缓慢行驶的地面 */
export const Opening: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const title = spring({fps, frame: frame - 8, config: {damping: 200}});
	const sub = spring({fps, frame: frame - 20, config: {damping: 200}});
	const meta = spring({fps, frame: frame - 34, config: {damping: 200}});

	// 结尾整体淡出，和下一场衔接
	const out = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 标题下的一道扫光
	const sweep = interpolate(frame, [26, 62], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: out}}>
			<Ground terrain={byId('gravel')} speed={0.55} opacity={0.62} seed="open" />
			<Scrim strength={0.78} cy={0.5} size="46% 40%" />

			<AbsoluteFill
				style={{
					alignItems: 'center',
					justifyContent: 'center',
					fontFamily: FONT,
				}}
			>
				{/* 英文小标 */}
				<div
					style={{
						fontSize: 26,
						letterSpacing: 16,
						color: C.accent2,
						opacity: sub,
						marginBottom: 26,
						fontWeight: 500,
					}}
				>
					ALL-TERRAIN MODE
				</div>

				{/* 主标题：遮罩上推 */}
				<div style={{overflow: 'hidden', padding: '0 12px'}}>
					<div
						style={{
							fontSize: 168,
							fontWeight: 700,
							color: C.text,
							letterSpacing: 12,
							lineHeight: 1.1,
							transform: `translateY(${interpolate(title, [0, 1], [190, 0])}px)`,
						}}
					>
						全地形模式
					</div>
				</div>

				{/* 扫光分割线 */}
				<div
					style={{
						marginTop: 34,
						width: 620,
						height: 2,
						background: 'rgba(255,255,255,0.09)',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: `${-40 + sweep * 120}%`,
							width: '40%',
							height: '100%',
							background: `linear-gradient(90deg, transparent, ${C.accent2}, transparent)`,
						}}
					/>
				</div>

				{/* 五种地形一行带过 */}
				<div
					style={{
						marginTop: 34,
						fontSize: 30,
						letterSpacing: 10,
						color: C.text2,
						opacity: meta,
					}}
				>
					泥地 · 沙地 · 雪地 · 湿地 · 碎石
				</div>
			</AbsoluteFill>

			{/* 文档出处 */}
			<div
				style={{
					position: 'absolute',
					bottom: 74,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: FONT,
					fontSize: 21,
					letterSpacing: 4,
					color: C.text4,
					opacity: meta,
				}}
			>
				需求文档 · 语音笔记整理 · Get达人 · 2026-08-13
			</div>
		</AbsoluteFill>
	);
};

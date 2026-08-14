import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {TerrainIcon} from '../components/TerrainIcon';
import {C, FONT, TERRAINS} from '../theme';

/** 五种地形依次入场；随后逐张扫过高亮，暗示"模式可切换" */
export const TerrainGrid: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const heading = spring({fps, frame: frame - 4, config: {damping: 200}});

	const out = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 卡片全部落位后，高亮指针依次扫过 5 张
	const scanStart = 96;
	const scanIndex = Math.floor(
		interpolate(frame, [scanStart, scanStart + 120], [0, TERRAINS.length], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}),
	);

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
			{/* 顶部标题 */}
			<div
				style={{
					position: 'absolute',
					top: 132,
					textAlign: 'center',
					opacity: heading,
					transform: `translateY(${interpolate(heading, [0, 1], [24, 0])}px)`,
				}}
			>
				<div style={{fontSize: 22, letterSpacing: 10, color: C.accent2, fontWeight: 500}}>
					MODES
				</div>
				<div
					style={{
						marginTop: 14,
						fontSize: 62,
						fontWeight: 700,
						color: C.text,
						letterSpacing: 4,
					}}
				>
					此模式包含五种地形
				</div>
			</div>

			{/* 五张卡片 */}
			<div style={{display: 'flex', gap: 32, marginTop: 70}}>
				{TERRAINS.map((t, i) => {
					const s = spring({
						fps,
						frame: frame - 18 - i * 8,
						config: {damping: 200},
					});
					const active = i === scanIndex && frame >= scanStart;
					const lift = active ? 1 : 0;

					return (
						<div
							key={t.id}
							style={{
								width: 300,
								height: 384,
								borderRadius: 24,
								background: active
									? `linear-gradient(180deg, ${t.color}26, rgba(18,22,24,0.9))`
									: C.panel,
								border: `1px solid ${active ? `${t.color}66` : C.panelLine}`,
								opacity: s,
								transform: `translateY(${
									interpolate(s, [0, 1], [56, 0]) - lift * 12
								}px)`,
								boxShadow: active
									? `0 30px 60px -34px ${t.color}, 0 0 0 1px ${t.color}22 inset`
									: 'none',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 26,
							}}
						>
							<div style={{color: t.color, opacity: active ? 1 : 0.78}}>
								<TerrainIcon id={t.id} size={92} />
							</div>
							<div
								style={{
									fontSize: 46,
									fontWeight: 700,
									color: active ? C.text : C.text2,
									letterSpacing: 4,
								}}
							>
								{t.name}
							</div>
							<div
								style={{
									fontSize: 19,
									letterSpacing: 6,
									color: active ? t.color : C.text4,
								}}
							>
								{t.en}
							</div>
						</div>
					);
				})}
			</div>

			{/* 底部说明 */}
			<div
				style={{
					position: 'absolute',
					bottom: 108,
					fontSize: 26,
					letterSpacing: 4,
					color: C.text3,
					opacity: spring({fps, frame: frame - 66, config: {damping: 200}}),
				}}
			>
				每种地形对应一套独立的动力与底盘标定
			</div>
		</AbsoluteFill>
	);
};

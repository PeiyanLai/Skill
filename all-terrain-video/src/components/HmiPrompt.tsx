import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, type Terrain} from '../theme';
import {TerrainIcon} from './TerrainIcon';

/**
 * 车机弹窗。放在 Sequence 里使用——子组件的 useCurrentFrame() 从 0 开始，
 * 因此这里所有动画都相对弹窗自己的出现时刻计算。
 */
export const HmiPrompt: React.FC<{
	terrain: Terrain;
	headline: string;
	question: string;
	primary: string;
	secondary: string;
	/** 第几帧按下主按钮；不传则不演示按下 */
	confirmAt?: number;
	/** 第几帧开始淡出，给后续画面让位 */
	exitAt?: number;
}> = ({terrain, headline, question, primary, secondary, confirmAt, exitAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const enter = spring({fps, frame, config: {damping: 200}});
	const exit =
		exitAt === undefined
			? 0
			: interpolate(frame - exitAt, [0, 14], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
				});
	const y = interpolate(enter, [0, 1], [40, 0]) - exit * 26;
	const scale = interpolate(enter, [0, 1], [0.94, 1]) * (1 - exit * 0.03);

	// 逐行错峰入场
	const line = (delay: number) =>
		spring({fps, frame: frame - delay, config: {damping: 200}});

	const pressed = confirmAt !== undefined && frame >= confirmAt;
	const pressT = confirmAt === undefined ? 0 : frame - confirmAt;
	// 按下瞬间的回弹
	const pressScale = pressed
		? interpolate(pressT, [0, 3, 10], [1, 0.95, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 1;
	// 按下后扩散的光环
	const ripple = pressed
		? interpolate(pressT, [0, 22], [0, 1], {
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			})
		: 0;

	// 未按下时主按钮的呼吸感（引导视线）
	const breathe = pressed
		? 0
		: interpolate(Math.sin((frame / fps) * 3.2), [-1, 1], [0, 1]);

	return (
		<div
			style={{
				width: 1020,
				transform: `translateY(${y}px) scale(${scale})`,
				opacity: enter * (1 - exit),
				borderRadius: 28,
				background: 'linear-gradient(180deg, rgba(22,28,30,0.97), rgba(12,16,17,0.97))',
				border: `1px solid ${C.panelLine}`,
				boxShadow: `0 40px 90px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03) inset`,
				padding: '44px 52px 46px',
				fontFamily: FONT,
			}}
		>
			{/* 顶部：模式标识 */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 16,
					opacity: line(2),
				}}
			>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: 14,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: `${terrain.color}1F`,
						border: `1px solid ${terrain.color}45`,
						color: terrain.color,
					}}
				>
					<TerrainIcon id={terrain.id} size={28} />
				</div>
				<div
					style={{
						fontSize: 22,
						letterSpacing: 3,
						color: C.text3,
						fontWeight: 500,
					}}
				>
					全地形模式
				</div>
				<div style={{flex: 1}} />
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						fontSize: 19,
						color: C.text4,
						letterSpacing: 1,
					}}
				>
					<div
						style={{
							width: 8,
							height: 8,
							borderRadius: '50%',
							background: C.accent2,
							boxShadow: `0 0 12px ${C.accent2}`,
						}}
					/>
					系统识别中
				</div>
			</div>

			{/* 主标题 */}
			<div
				style={{
					marginTop: 34,
					fontSize: 76,
					fontWeight: 700,
					color: C.text,
					letterSpacing: 2,
					lineHeight: 1.15,
					opacity: line(5),
					transform: `translateY(${interpolate(line(5), [0, 1], [16, 0])}px)`,
				}}
			>
				{headline}
			</div>

			{/* 询问语 */}
			<div
				style={{
					marginTop: 18,
					fontSize: 38,
					color: C.text2,
					letterSpacing: 1,
					opacity: line(9),
					transform: `translateY(${interpolate(line(9), [0, 1], [14, 0])}px)`,
				}}
			>
				{question}
			</div>

			{/* 按钮组 */}
			<div
				style={{
					marginTop: 44,
					display: 'flex',
					gap: 20,
					opacity: line(14),
					transform: `translateY(${interpolate(line(14), [0, 1], [14, 0])}px)`,
				}}
			>
				<div
					style={{
						position: 'relative',
						flex: 1,
						height: 92,
						borderRadius: 18,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 34,
						fontWeight: 700,
						letterSpacing: 4,
						color: '#00201F',
						background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
						transform: `scale(${pressScale})`,
						boxShadow: `0 0 ${18 + breathe * 26}px ${
							pressed ? C.accentGlow : `rgba(0,212,212,${0.16 + breathe * 0.22})`
						}`,
					}}
				>
					{/* 按下的水波纹 */}
					{ripple > 0 ? (
						<div
							style={{
								position: 'absolute',
								inset: 0,
								borderRadius: 18,
								border: `2px solid ${C.accent2}`,
								transform: `scale(${1 + ripple * 0.14})`,
								opacity: 1 - ripple,
							}}
						/>
					) : null}
					{primary}
				</div>
				<div
					style={{
						width: 300,
						height: 92,
						borderRadius: 18,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 34,
						letterSpacing: 4,
						color: C.text3,
						background: 'rgba(255,255,255,0.04)',
						border: `1px solid ${C.panelLine}`,
					}}
				>
					{secondary}
				</div>
			</div>
		</div>
	);
};

import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';

/** 每个核心功能场景左上角的编号 + 标题 */
export const SceneHeader: React.FC<{index: string; title: string}> = ({
	index,
	title,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({fps, frame, config: {damping: 200}});
	const x = interpolate(enter, [0, 1], [-30, 0]);

	// 标题下方的强调线由左向右展开
	const rule = spring({fps, frame: frame - 6, config: {damping: 200}});

	return (
		<div
			style={{
				position: 'absolute',
				top: 84,
				left: 110,
				fontFamily: FONT,
				opacity: enter,
				transform: `translateX(${x}px)`,
			}}
		>
			<div
				style={{
					fontSize: 22,
					letterSpacing: 8,
					color: C.accent2,
					fontWeight: 500,
				}}
			>
				核心功能 {index}
			</div>
			<div
				style={{
					marginTop: 12,
					fontSize: 54,
					fontWeight: 700,
					color: C.text,
					letterSpacing: 3,
				}}
			>
				{title}
			</div>
			<div
				style={{
					marginTop: 18,
					height: 3,
					width: 120 * rule,
					background: `linear-gradient(90deg, ${C.accent2}, transparent)`,
					borderRadius: 3,
				}}
			/>
		</div>
	);
};

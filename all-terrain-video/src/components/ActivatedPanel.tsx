import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, type Terrain} from '../theme';
import {TerrainIcon} from './TerrainIcon';

/** 模式开启后的确认态：勾选 + 模式名 + 随模式联动的标定项 */
export const ActivatedPanel: React.FC<{
	terrain: Terrain;
	label?: string;
	params?: string[];
}> = ({
	terrain,
	label = '已开启',
	params = ['动力响应', '牵引控制', '陡坡缓降'],
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const enter = spring({fps, frame, config: {damping: 200}});
	const ring = interpolate(frame, [0, 26], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				fontFamily: FONT,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				opacity: enter,
				transform: `translateY(${interpolate(enter, [0, 1], [30, 0])}px)`,
			}}
		>
			{/* 图标 + 完成环 */}
			<div
				style={{
					position: 'relative',
					width: 168,
					height: 168,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<svg
					width={168}
					height={168}
					viewBox="0 0 168 168"
					style={{position: 'absolute', transform: 'rotate(-90deg)'}}
					fill="none"
				>
					<circle cx="84" cy="84" r="79" stroke={C.panelLine} strokeWidth="3" />
					<circle
						cx="84"
						cy="84"
						r="79"
						stroke={terrain.color}
						strokeWidth="3.5"
						strokeLinecap="round"
						strokeDasharray={2 * Math.PI * 79}
						strokeDashoffset={2 * Math.PI * 79 * (1 - ring)}
					/>
				</svg>
				<div style={{color: terrain.color}}>
					<TerrainIcon id={terrain.id} size={82} />
				</div>
			</div>

			<div
				style={{
					marginTop: 30,
					fontSize: 66,
					fontWeight: 700,
					color: C.text,
					letterSpacing: 4,
				}}
			>
				{terrain.name}模式
				<span style={{color: terrain.color, marginLeft: 20}}>{label}</span>
			</div>

			{/* 标定项逐个点亮 */}
			<div style={{marginTop: 34, display: 'flex', gap: 16}}>
				{params.map((p, i) => {
					const s = spring({
						fps,
						frame: frame - 14 - i * 7,
						config: {damping: 200},
					});
					return (
						<div
							key={p}
							style={{
								padding: '16px 30px',
								borderRadius: 999,
								fontSize: 25,
								letterSpacing: 2,
								color: C.text2,
								background: C.panel,
								border: `1px solid ${C.panelLine}`,
								opacity: s,
								transform: `translateY(${interpolate(s, [0, 1], [16, 0])}px)`,
								display: 'flex',
								alignItems: 'center',
								gap: 12,
							}}
						>
							<div
								style={{
									width: 7,
									height: 7,
									borderRadius: '50%',
									background: terrain.color,
								}}
							/>
							{p}
							<span style={{color: terrain.color, fontSize: 22}}>已适配</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

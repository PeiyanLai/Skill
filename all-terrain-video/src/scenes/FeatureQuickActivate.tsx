import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {Ground} from '../components/Ground';
import {SceneHeader} from '../components/SceneHeader';
import {Scrim} from '../components/Scrim';
import {SteeringWheel} from '../components/SteeringWheel';
import {TerrainIcon} from '../components/TerrainIcon';
import {C, FONT, TERRAINS, byId} from '../theme';

const PRESS_AT = 84;
const ACTIVE_ID = 'snow';

/**
 * 核心功能 2：便捷激活
 * 方向盘按键按下 → 对应地形模式直接进入，不必在中控屏里逐层点
 */
export const FeatureQuickActivate: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();

	const out = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const listTitle = spring({fps, frame: frame - 14, config: {damping: 200}});
	const caption = spring({fps, frame: frame - 150, config: {damping: 200}});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: out}}>
			<Ground terrain={byId(ACTIVE_ID)} speed={0.85} opacity={0.5} seed="qa" />
			<Scrim strength={0.8} cy={0.54} size="62% 46%" />

			<SceneHeader index="02" title="便捷激活" />

			<AbsoluteFill
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 96,
					fontFamily: FONT,
					paddingTop: 60,
				}}
			>
				{/* 方向盘 */}
				<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
					<SteeringWheel pressAt={PRESS_AT} width={720} />
					<div
						style={{
							marginTop: 10,
							fontSize: 26,
							letterSpacing: 5,
							color: frame >= PRESS_AT ? C.accent2 : C.text3,
						}}
					>
						{frame >= PRESS_AT ? '按键已触发' : '方向盘多功能按键'}
					</div>
				</div>

				{/* 模式列表 */}
				<div style={{width: 620}}>
					<div
						style={{
							fontSize: 24,
							letterSpacing: 8,
							color: C.text3,
							opacity: listTitle,
							marginBottom: 26,
						}}
					>
						一键进入对应模式
					</div>

					{TERRAINS.map((t, i) => {
						const s = spring({
							fps,
							frame: frame - 20 - i * 6,
							config: {damping: 200},
						});
						const isActive = t.id === ACTIVE_ID && frame >= PRESS_AT;
						// 激活行的强调条从左侧展开
						const bar = isActive
							? spring({fps, frame: frame - PRESS_AT, config: {damping: 200}})
							: 0;

						return (
							<div
								key={t.id}
								style={{
									position: 'relative',
									height: 96,
									marginBottom: 16,
									borderRadius: 18,
									display: 'flex',
									alignItems: 'center',
									gap: 22,
									paddingLeft: 28,
									overflow: 'hidden',
									background: isActive
										? `linear-gradient(90deg, ${t.color}2E, rgba(18,22,24,0.9))`
										: C.panel,
									border: `1px solid ${isActive ? `${t.color}55` : C.panelLine}`,
									opacity: s * (isActive || frame < PRESS_AT ? 1 : 0.42),
									transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px) scale(${
										1 + bar * 0.015
									})`,
								}}
							>
								<div
									style={{
										position: 'absolute',
										left: 0,
										top: 0,
										bottom: 0,
										width: 5,
										background: t.color,
										transform: `scaleY(${bar})`,
									}}
								/>
								<div style={{color: isActive ? t.color : C.text3}}>
									<TerrainIcon id={t.id} size={44} />
								</div>
								<div
									style={{
										fontSize: 38,
										fontWeight: isActive ? 700 : 500,
										color: isActive ? C.text : C.text2,
										letterSpacing: 4,
									}}
								>
									{t.name}模式
								</div>
								<div style={{flex: 1}} />
								{isActive ? (
									<div
										style={{
											marginRight: 28,
											fontSize: 24,
											letterSpacing: 3,
											color: t.color,
											opacity: bar,
										}}
									>
										已进入
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</AbsoluteFill>

			{/* 底部说明 */}
			<div
				style={{
					position: 'absolute',
					bottom: 78,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: FONT,
					fontSize: 27,
					letterSpacing: 4,
					color: C.text3,
					opacity: caption,
				}}
			>
				手不离方向盘，无需在中控屏层层进入菜单
			</div>
		</AbsoluteFill>
	);
};

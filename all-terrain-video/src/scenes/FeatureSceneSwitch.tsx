import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	Sequence,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {wipe} from '@remotion/transitions/wipe';
import {ActivatedPanel} from '../components/ActivatedPanel';
import {Ground} from '../components/Ground';
import {HmiPrompt} from '../components/HmiPrompt';
import {SceneHeader} from '../components/SceneHeader';
import {Scrim} from '../components/Scrim';
import {ASPHALT, C, FONT, byId} from '../theme';

const SWITCH_AT = 178; // 用户确认切换的绝对帧

/**
 * 核心功能 3：场景切换识别
 * 行驶中路面由柏油路变为沙地 → 系统主动识别并提醒切换
 */
export const FeatureSceneSwitch: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const sand = byId('sand');

	const out = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 右上角的地形变化指示，在路面切换时出现
	const chip = spring({fps, frame: frame - 66, config: {damping: 200}});
	const switched = frame >= SWITCH_AT;

	// 弹窗出现前有 3 秒空档，用底部状态文案接住，避免画面发空
	const cruiseCap = interpolate(frame, [10, 24, 46, 58], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const changeCap = interpolate(frame, [62, 74, 88, 100], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: out}}>
			{/* 路面：柏油路被沙地擦除替换 */}
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={80}>
					<Ground terrain={ASPHALT} speed={1.4} seed="ss-asphalt" />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({durationInFrames: 30})}
					presentation={wipe()}
				/>
				<TransitionSeries.Sequence durationInFrames={280}>
					<Ground terrain={sand} speed={1.1} seed="ss-sand" />
				</TransitionSeries.Sequence>
			</TransitionSeries>

			<SceneHeader index="03" title="场景切换识别" />

			{/* 地形变化指示 */}
			<div
				style={{
					position: 'absolute',
					top: 96,
					right: 110,
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					fontFamily: FONT,
					opacity: chip,
					transform: `translateY(${interpolate(chip, [0, 1], [-16, 0])}px)`,
				}}
			>
				<Chip label={ASPHALT.name} color={ASPHALT.color} dim />
				{/* 用 SVG 画箭头：字体子集里没有 U+2192，落到 fallback 字体会破坏字形一致性 */}
				<svg width="34" height="18" viewBox="0 0 34 18" fill="none">
					<path
						d="M2 9h28M23 2l7 7-7 7"
						stroke={switched ? sand.color : C.text4}
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<Chip label={sand.name} color={sand.color} dim={!switched} />
			</div>

			{/* 行驶状态文案 */}
			<div
				style={{
					position: 'absolute',
					bottom: 96,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: FONT,
					fontSize: 26,
					letterSpacing: 6,
					color: C.text3,
					opacity: cruiseCap,
				}}
			>
				柏油路 · 行驶中持续监测路面
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: 96,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: FONT,
					fontSize: 26,
					letterSpacing: 6,
					color: C.accent2,
					opacity: changeCap,
				}}
			>
				检测到路面变化…
			</div>

			{/* 系统主动提醒切换 */}
			<Sequence from={96} durationInFrames={138}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<HmiPrompt
						terrain={sand}
						headline="已驶入沙地"
						question="是否为您切换到沙地模式？"
						primary="切换"
						secondary="保持"
						confirmAt={SWITCH_AT - 96}
						exitAt={118}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* 切换完成 */}
			<Sequence from={230}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<Scrim strength={0.86} cy={0.54} size="44% 42%" />
					<ActivatedPanel
						terrain={sand}
						label="已切换"
						params={['动力响应', '防陷控制', '四驱分配']}
					/>
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

const Chip: React.FC<{label: string; color: string; dim?: boolean}> = ({
	label,
	color,
	dim,
}) => (
	<div
		style={{
			padding: '12px 26px',
			borderRadius: 999,
			fontSize: 26,
			letterSpacing: 3,
			color: dim ? C.text3 : C.text,
			background: dim ? 'rgba(255,255,255,0.04)' : `${color}22`,
			border: `1px solid ${dim ? C.panelLine : `${color}66`}`,
		}}
	>
		{label}
	</div>
);

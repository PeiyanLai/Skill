import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {ActivatedPanel} from '../components/ActivatedPanel';
import {Ground} from '../components/Ground';
import {HmiPrompt} from '../components/HmiPrompt';
import {SceneHeader} from '../components/SceneHeader';
import {Scrim} from '../components/Scrim';
import {ASPHALT, C, FONT, byId} from '../theme';

/**
 * 核心功能 1：自动识别与提醒
 * 柏油路行驶 → 驶入雪地 → 系统主动询问 → 用户确认 → 模式开启
 */
export const FeatureAutoDetect: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const snow = byId('snow');

	const out = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// 柏油路阶段的地面说明，驶入雪地前淡出
	const asphaltCap = interpolate(frame, [10, 26, 58, 74], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	// 识别中提示，紧接着弹窗出现
	const scanCap = interpolate(frame, [66, 78, 88, 96], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{background: C.bg, opacity: out}}>
			{/* 背景：地形由柏油路过渡到雪地 */}
			<TransitionSeries>
				<TransitionSeries.Sequence durationInFrames={70}>
					<Ground terrain={ASPHALT} speed={1.35} seed="ad-asphalt" />
				</TransitionSeries.Sequence>
				<TransitionSeries.Transition
					timing={linearTiming({durationInFrames: 25})}
					presentation={fade()}
				/>
				<TransitionSeries.Sequence durationInFrames={285}>
					<Ground terrain={snow} speed={1.05} seed="ad-snow" />
				</TransitionSeries.Sequence>
			</TransitionSeries>

			<SceneHeader index="01" title="自动识别与提醒" />

			{/* 地面状态说明 */}
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
					opacity: asphaltCap,
				}}
			>
				柏油路 · 常规驾驶
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
					opacity: scanCap,
				}}
			>
				地形识别中…
			</div>

			{/* 系统主动询问 */}
			<Sequence from={88} durationInFrames={130}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<HmiPrompt
						terrain={snow}
						headline="已驶入雪地"
						question="是否为您打开全地形模式？"
						primary="打开"
						secondary="暂不"
						confirmAt={78}
						exitAt={112}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* 确认后的开启态 */}
			<Sequence from={214}>
				<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
					<Scrim strength={0.86} cy={0.54} size="44% 42%" />
					<ActivatedPanel terrain={snow} />
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

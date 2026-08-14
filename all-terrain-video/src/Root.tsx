import React from 'react';
import {AbsoluteFill, Composition, Series} from 'remotion';
import './fonts';
import {Closing} from './scenes/Closing';
import {FeatureAutoDetect} from './scenes/FeatureAutoDetect';
import {FeatureQuickActivate} from './scenes/FeatureQuickActivate';
import {FeatureSceneSwitch} from './scenes/FeatureSceneSwitch';
import {Opening} from './scenes/Opening';
import {TerrainGrid} from './scenes/TerrainGrid';
import {C} from './theme';

/** 各场景时长（帧，30fps） */
export const SCENES = {
	opening: 120, // 4.0s 开场
	terrains: 240, // 8.0s 五种地形
	feature1: 330, // 11.0s 自动识别与提醒
	feature2: 270, // 9.0s 便捷激活
	feature3: 330, // 11.0s 场景切换识别
	closing: 180, // 6.0s 收尾
} as const;

export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0); // 1470 帧 = 49s

const Main: React.FC = () => {
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Series>
				<Series.Sequence durationInFrames={SCENES.opening}>
					<Opening />
				</Series.Sequence>
				<Series.Sequence durationInFrames={SCENES.terrains}>
					<TerrainGrid />
				</Series.Sequence>
				<Series.Sequence durationInFrames={SCENES.feature1}>
					<FeatureAutoDetect />
				</Series.Sequence>
				<Series.Sequence durationInFrames={SCENES.feature2}>
					<FeatureQuickActivate />
				</Series.Sequence>
				<Series.Sequence durationInFrames={SCENES.feature3}>
					<FeatureSceneSwitch />
				</Series.Sequence>
				<Series.Sequence durationInFrames={SCENES.closing}>
					<Closing />
				</Series.Sequence>
			</Series>
		</AbsoluteFill>
	);
};

export const Root: React.FC = () => {
	return (
		<>
			<Composition
				id="AllTerrainMode"
				component={Main}
				durationInFrames={TOTAL}
				width={1920}
				height={1080}
				fps={30}
				defaultProps={{}}
			/>
		</>
	);
};

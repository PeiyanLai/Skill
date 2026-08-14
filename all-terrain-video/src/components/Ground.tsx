import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import type {Terrain} from '../theme';

const HORIZON = 0.52; // 地平线在画面高度的比例

/**
 * 行驶中的地面。透视线与颗粒都由 frame 推导，
 * 随机分布用 remotion 的 random(seed)（禁止 Math.random，否则每帧结果不一致）。
 */
export const Ground: React.FC<{
	terrain: Terrain;
	/** 车速感，0 = 静止 */
	speed?: number;
	/** 地面整体透明度，供转场淡入淡出使用 */
	opacity?: number;
	seed?: string;
}> = ({terrain, speed = 1, opacity = 1, seed = 'g'}) => {
	const frame = useCurrentFrame();
	const travel = frame * speed;

	// 透视条纹：每条从地平线向下加速推进，模拟车辆前进
	const stripes = new Array(14).fill(0).map((_, i) => {
		const t = ((travel * 0.012 + i / 14) % 1 + 1) % 1;
		// t=0 在地平线，t=1 在画面底部；用平方做透视加速
		const p = t * t;
		const y = HORIZON + p * (1 - HORIZON);
		const h = interpolate(p, [0, 1], [1.5, 16], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		// 中段压低，给画面中央的文字让位；靠近底部再放亮保留行驶动势
		const o = interpolate(p, [0, 0.15, 0.45, 1], [0, 0.3, 0.16, 0.42], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		return {key: i, y, h, o};
	});

	// 地形颗粒：泥点 / 沙粒 / 雪花 / 碎石，位置固定，随行驶向下漂移
	const grains = new Array(46).fill(0).map((_, i) => {
		const gx = random(`${seed}-x-${i}`);
		const base = random(`${seed}-y-${i}`);
		const sz = random(`${seed}-s-${i}`);
		const t = ((base + travel * 0.0055 * (0.5 + sz)) % 1 + 1) % 1;
		const p = t * t;
		const y = HORIZON + p * (1 - HORIZON);
		// 越靠近画面底部，横向越发散（透视）
		const x = 0.5 + (gx - 0.5) * (0.25 + p * 2.1);
		const size = interpolate(p, [0, 1], [1, 9], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}) * (0.5 + sz);
		const o = interpolate(p, [0, 0.2, 0.9, 1], [0, 0.5, 0.4, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		return {key: i, x, y, size, o};
	});

	return (
		<AbsoluteFill style={{opacity}}>
			{/* 天空 / 远景 */}
			<AbsoluteFill
				style={{
					background: `linear-gradient(180deg, #05070800 0%, ${terrain.ground}55 ${
						HORIZON * 100 - 12
					}%, ${terrain.ground} ${HORIZON * 100}%, ${terrain.ground} 100%)`,
				}}
			/>

			{/* 地平线光带 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: `${HORIZON * 100}%`,
					height: 2,
					background: `linear-gradient(90deg, transparent, ${terrain.color}, transparent)`,
					opacity: 0.5,
				}}
			/>

			{/* 透视条纹 */}
			{stripes.map((s) => (
				<div
					key={s.key}
					style={{
						position: 'absolute',
						left: '50%',
						transform: 'translateX(-50%)',
						top: `${s.y * 100}%`,
						width: `${20 + (s.y - HORIZON) * 320}%`,
						height: s.h,
						borderRadius: s.h,
						background: terrain.color,
						opacity: s.o,
					}}
				/>
			))}

			{/* 地形颗粒 */}
			{grains.map((g) => (
				<div
					key={g.key}
					style={{
						position: 'absolute',
						left: `${g.x * 100}%`,
						top: `${g.y * 100}%`,
						width: g.size,
						height: g.size,
						borderRadius: '50%',
						background: terrain.color,
						opacity: g.o,
					}}
				/>
			))}

			{/* 暗角，把注意力压回中心的 HMI */}
			<AbsoluteFill
				style={{
					background:
						'radial-gradient(ellipse 62% 58% at 50% 46%, transparent 0%, rgba(0,0,0,0.62) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};

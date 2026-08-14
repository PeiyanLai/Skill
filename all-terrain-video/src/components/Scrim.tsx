import React from 'react';
import {AbsoluteFill} from 'remotion';

/**
 * 内容压暗层。地面的透视条纹会从半透明面板后面穿过去影响可读性，
 * 在正文区域垫一层径向压暗即可，同时保留画面边缘的行驶动势。
 */
export const Scrim: React.FC<{
	/** 压暗强度 */
	strength?: number;
	/** 椭圆中心（画面比例） */
	cy?: number;
	size?: string;
}> = ({strength = 0.82, cy = 0.5, size = '52% 44%'}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse ${size} at 50% ${cy * 100}%, rgba(6,8,9,${strength}) 0%, rgba(6,8,9,${
				strength * 0.72
			}) 55%, transparent 78%)`,
		}}
	/>
);

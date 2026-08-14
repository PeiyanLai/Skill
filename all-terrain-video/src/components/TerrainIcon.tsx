import React from 'react';

/**
 * 五种地形的线性图标。统一 64x64 viewBox、统一描边宽度，
 * 用 currentColor 取色，方便跟随地形主色。
 */
export const TerrainIcon: React.FC<{id: string; size?: number}> = ({
	id,
	size = 64,
}) => {
	const common = {
		width: size,
		height: size,
		viewBox: '0 0 64 64',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 2.4,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
	};

	if (id === 'mud') {
		// 泥浆波纹 + 溅起的泥点
		return (
			<svg {...common}>
				<path d="M6 44c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0" />
				<path d="M6 55c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0" opacity={0.45} />
				<path d="M20 30c0 3-1.8 5-4 5s-4-2-4-5 4-9 4-9 4 6 4 9z" />
				<path d="M52 28c0 3-1.8 5-4 5s-4-2-4-5 4-9 4-9 4 6 4 9z" opacity={0.75} />
				<circle cx="32" cy="20" r="3.2" />
				<circle cx="32" cy="33" r="1.8" opacity={0.55} />
			</svg>
		);
	}

	if (id === 'sand') {
		return (
			<svg {...common}>
				<path d="M4 48c8 0 10-14 20-14s12 14 20 14" />
				<path d="M28 48c6 0 8-9 16-9s10 9 16 9" opacity={0.55} />
				<path d="M6 57h52" opacity={0.35} />
				<circle cx="46" cy="17" r="6" />
			</svg>
		);
	}

	if (id === 'snow') {
		return (
			<svg {...common}>
				<path d="M32 8v48M13 20l38 24M51 20L13 44" />
				<path d="M32 18l-6-6M32 18l6-6M32 46l-6 6M32 46l6 6" />
				<path d="M20 26l-8-2M20 26l-2-8M44 38l8 2M44 38l2 8" opacity={0.7} />
			</svg>
		);
	}

	if (id === 'wet') {
		// 水面波纹 + 香蒲芦苇，和泥地的"泥点"区分开
		return (
			<svg {...common}>
				<path d="M24 40V14" />
				<ellipse cx="24" cy="12" rx="3.4" ry="7" />
				<path d="M40 41V20" opacity={0.75} />
				<ellipse cx="40" cy="18" rx="2.8" ry="5.6" opacity={0.75} />
				<path d="M6 46c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0" />
				<path d="M6 56c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0" opacity={0.5} />
			</svg>
		);
	}

	// gravel
	return (
		<svg {...common}>
			<path d="M8 50h48" opacity={0.35} />
			<path d="M14 42l6-8 8 3-3 8z" />
			<path d="M33 44l5-9 9 4-4 8z" />
			<path d="M24 26l5-6 6 3-3 6z" opacity={0.7} />
			<circle cx="49" cy="28" r="3.4" opacity={0.65} />
		</svg>
	);
};

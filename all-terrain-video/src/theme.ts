/**
 * 视觉 token —— 深色车机 HMI 风格。
 * 主色沿用仓库 NIOFlow 规范（accent #00bebe / #00D4D4，深色底 #0a0a0a）；
 * 地形色统一压低饱和度，保证 teal 始终是画面里最亮的强调色。
 */

export const FONT = "'Noto Sans SC', 'WenQuanYi Zen Hei', sans-serif";

export const C = {
	bg: '#0a0a0a',
	bgSoft: '#101617',
	accent: '#00bebe',
	accent2: '#00D4D4',
	accentGlow: 'rgba(0, 212, 212, 0.28)',

	text: '#FFFFFF',
	text2: 'rgba(255, 255, 255, 0.72)',
	text3: 'rgba(255, 255, 255, 0.44)',
	text4: 'rgba(255, 255, 255, 0.26)',

	// 面板用不透明深色而非半透明白，避免背景条纹穿透影响文字可读性
	panel: 'rgba(18, 22, 24, 0.76)',
	panelLine: 'rgba(255, 255, 255, 0.10)',
} as const;

export type Terrain = {
	id: string;
	name: string;
	en: string;
	color: string;
	/** 该地形的地面底色，用于场景背景 */
	ground: string;
};

export const TERRAINS: Terrain[] = [
	{id: 'mud', name: '泥地', en: 'MUD', color: '#A87B52', ground: '#3A2A1C'},
	{id: 'sand', name: '沙地', en: 'SAND', color: '#D2A961', ground: '#43341C'},
	{id: 'snow', name: '雪地', en: 'SNOW', color: '#A9CBE2', ground: '#26333D'},
	{id: 'wet', name: '湿地', en: 'WETLAND', color: '#59A395', ground: '#1B3630'},
	{id: 'gravel', name: '碎石', en: 'GRAVEL', color: '#98A2AE', ground: '#2B3037'},
];

export const byId = (id: string): Terrain =>
	TERRAINS.find((t) => t.id === id) ?? TERRAINS[0];

/** 柏油路（对照组，非全地形模式） */
export const ASPHALT: Terrain = {
	id: 'asphalt',
	name: '柏油路',
	en: 'ASPHALT',
	color: '#7C8894',
	ground: '#16191C',
};

/** 全片统一的缓动，避免各场景手写不同 bezier 造成节奏不一致 */
export const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

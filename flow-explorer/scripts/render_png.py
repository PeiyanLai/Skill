#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
flow-explorer 零浏览器出图脚本

不依赖浏览器、不依赖外部渲染服务：纯 Python + Pillow，从流程数据
JSON 直接画出 NIO 配色的流程图 PNG。适用于没有 Chromium 的受限环境
（内部 agent、代码执行容器等），产出可直接插入飞书文档图片块。

用法：
    python3 render_png.py <data.json> [输出.png] [选项]

data.json 结构（与页面「导出 JSON」兼容，title/tags 为可选扩展）：
    {
      "title":  "对讲机组队功能交互流程",          // 可选，图顶标题
      "tags":   { "key": {"label","border","fill","text","shape"} },  // 可选，覆盖默认色板
      "nodes":  { "ID": {"title","tag", ...} },
      "edges":  [ {"from","to","label","style"} ],
      "phases": [ {"id","num","title","hint","nodes":[...]} ]
    }

选项：
    --scale N       清晰度倍数，默认 2（输出像素 = 逻辑尺寸 × N）
    --max-width N   每行节点的最大逻辑宽度，默认 960
    --font 路径     指定中文字体文件（.ttf/.ttc/.otf）

依赖：pip install pillow；需要系统里有任一中文字体
      （或用环境变量 FONT_PATH / --font 指定）。
"""
import json
import math
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("缺少依赖：请先执行  pip install pillow")

# ---------------- NIO 色板（NIOFlow 设计系统） ----------------
DEFAULT_TAGS = {
    "core":     {"label": "核心流程",    "border": "#00bebe", "fill": "#D0F5F5", "text": "#0B4A4A"},
    "infra":    {"label": "底层能力",    "border": "#004b64", "fill": "#DEF0F4", "text": "#00323F"},
    "process":  {"label": "常规处理",    "border": "#3D8090", "fill": "#E1EEF1", "text": "#1F3E45"},
    "account":  {"label": "账号 / 三方", "border": "#5D4DD4", "fill": "#ECE9FB", "text": "#2A2260"},
    "external": {"label": "外部动作",    "border": "#D49922", "fill": "#FBF1DA", "text": "#4A3A10"},
    "decision": {"label": "判断 / 分支", "border": "#00AAAA", "fill": "#FFFFFF", "text": "#1A1F1F", "shape": "diamond", "dashed": True},
    "alert":    {"label": "异常 / 降级", "border": "#D14545", "fill": "#FBE9E9", "text": "#5C1D1D"},
    # 对讲机示例等旧数据的分类 key 兼容映射
    "buy":  {"label": "购买 / 硬件流转", "border": "#D49922", "fill": "#FBF1DA", "text": "#4A3A10"},
    "bind": {"label": "连接 / 账号绑定", "border": "#5D4DD4", "fill": "#ECE9FB", "text": "#2A2260"},
    "team": {"label": "组队 / 信息共享", "border": "#00bebe", "fill": "#D0F5F5", "text": "#0B4A4A"},
    "talk": {"label": "在线对讲链路",   "border": "#3D8090", "fill": "#E1EEF1", "text": "#1F3E45"},
    "radio": {"label": "无网硬件对讲",  "border": "#004b64", "fill": "#DEF0F4", "text": "#00323F"},
}
INK1, INK3, INK4 = "#1A1F1F", "#5C7070", "#8AABAB"
LINE_COLOR, LABEL_BG, LABEL_BORDER = "#8AABAB", "#F0FAFA", "#D8EEEE"
CLUSTER_FILL, CLUSTER_BORDER = "#F4FBFB", "#B8DEDE"
ACCENT, ACCENT2 = "#00bebe", "#00D4D4"

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "C:/Windows/Fonts/msyh.ttc",
]


def find_font(explicit=None):
    for p in [explicit, os.environ.get("FONT_PATH")] + FONT_CANDIDATES:
        if p and os.path.exists(p):
            return p
    sys.exit("找不到中文字体。请安装（如 apt-get install fonts-wqy-zenhei 或 fonts-noto-cjk），"
             "或用 --font / 环境变量 FONT_PATH 指定字体文件路径。")


def wrap_title(s, limit=14, chunk=12):
    s = " ".join(str(s).split())
    if len(s) <= limit:
        return [s]
    return [s[i:i + chunk] for i in range(0, len(s), chunk)]


def bezier_points(p1, c1, c2, p2, n=48):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt**3 * p1[0] + 3 * mt**2 * t * c1[0] + 3 * mt * t**2 * c2[0] + t**3 * p2[0]
        y = mt**3 * p1[1] + 3 * mt**2 * t * c1[1] + 3 * mt * t**2 * c2[1] + t**3 * p2[1]
        pts.append((x, y))
    return pts


def draw_polyline(draw, pts, color, width, dashed=False, dash=(7, 6)):
    if not dashed:
        draw.line(pts, fill=color, width=width, joint="curve")
        return
    on, off = dash
    pen_on, remain = True, on
    prev = pts[0]
    for cur in pts[1:]:
        seg = math.dist(prev, cur)
        pos = 0.0
        while pos < seg:
            step = min(remain, seg - pos)
            a = (prev[0] + (cur[0] - prev[0]) * (pos / seg), prev[1] + (cur[1] - prev[1]) * (pos / seg))
            pos2 = pos + step
            b = (prev[0] + (cur[0] - prev[0]) * (pos2 / seg), prev[1] + (cur[1] - prev[1]) * (pos2 / seg))
            if pen_on:
                draw.line([a, b], fill=color, width=width)
            pos = pos2
            remain -= step
            if remain <= 0:
                pen_on = not pen_on
                remain = on if pen_on else off
        prev = cur


class Renderer:
    def __init__(self, data, scale=2, max_row_w=960, font_path=None):
        self.d = data
        self.S = scale
        self.max_row_w = max_row_w
        self.tags = dict(DEFAULT_TAGS)
        self.tags.update(data.get("tags") or {})
        fp = find_font(font_path)
        self.f_node = ImageFont.truetype(fp, 14 * scale)
        self.f_phase = ImageFont.truetype(fp, 16 * scale)
        self.f_hint = ImageFont.truetype(fp, 12 * scale)
        self.f_label = ImageFont.truetype(fp, 12 * scale)
        self.f_title = ImageFont.truetype(fp, 21 * scale)
        self.geo = {}      # id -> dict(x,y,w,h,cx,cy) 逻辑坐标
        self.phase_boxes = []  # (x0,y0,x1,y1,num_title,hint)

    def tag_of(self, node):
        return self.tags.get(node.get("tag"), self.tags["process"])

    # ---------- 尺寸测量（逻辑 px） ----------
    def node_size(self, node):
        lines = wrap_title(node.get("title", ""))
        tw = max(self.f_node.getlength(t) for t in lines) / self.S
        th = len(lines) * 20
        if self.tag_of(node).get("shape") == "diamond":
            w = max(tw + 96, 150)
            h = max(th + 64, w * 0.48)
            return w, h, lines
        return max(tw + 34, 110), th + 22, lines

    # ---------- 布局：阶段纵向堆叠，阶段内节点按行排 ----------
    def layout(self):
        MARGIN, PHASE_GAP, PAD, TITLE_H = 48, 64, 26, 46
        HGAP, VGAP = 52, 56
        y = MARGIN
        title = self.d.get("title")
        if title:
            y += 52
        phases = list(self.d.get("phases") or [])
        placed = set()
        for p in phases:
            placed.update(p.get("nodes") or [])
        orphans = [i for i in self.d.get("nodes", {}) if i not in placed]
        if orphans:
            phases = phases + [{"num": "未分组", "title": "", "hint": "", "nodes": orphans}]

        bands = []
        max_content = 0
        for p in phases:
            ids = [i for i in (p.get("nodes") or []) if i in self.d["nodes"]]
            if not ids:
                continue
            rows, cur, cur_w = [], [], 0.0
            for nid in ids:
                w, h, lines = self.node_size(self.d["nodes"][nid])
                if cur and cur_w + HGAP + w > self.max_row_w:
                    rows.append(cur)
                    cur, cur_w = [], 0.0
                cur.append((nid, w, h, lines))
                cur_w += (HGAP if len(cur) > 1 else 0) + w
            if cur:
                rows.append(cur)
            content_w = max(sum(w for _, w, _, _ in r) + HGAP * (len(r) - 1) for r in rows)
            max_content = max(max_content, content_w)
            bands.append((p, rows, content_w))

        canvas_w = max(max_content + 2 * PAD + 2 * MARGIN,
                       (self.f_title.getlength(title) / self.S + 2 * MARGIN) if title else 0, 640)

        for p, rows, content_w in bands:
            band_x0 = (canvas_w - content_w - 2 * PAD) / 2
            band_y0 = y
            ny = band_y0 + TITLE_H
            for r in rows:
                row_w = sum(w for _, w, _, _ in r) + HGAP * (len(r) - 1)
                row_h = max(h for _, _, h, _ in r)
                nx = band_x0 + PAD + (content_w - row_w) / 2
                for nid, w, h, lines in r:
                    self.geo[nid] = {"x": nx, "y": ny + (row_h - h) / 2, "w": w, "h": h,
                                     "cx": nx + w / 2, "cy": ny + (row_h - h) / 2 + h / 2, "lines": lines}
                    nx += w + HGAP
                ny += row_h + VGAP
            band_y1 = ny - VGAP + PAD
            label = p.get("num", "") + ((" · " + p["title"]) if p.get("title") else "")
            self.phase_boxes.append((band_x0, band_y0, band_x0 + content_w + 2 * PAD, band_y1,
                                     label, p.get("hint", "")))
            y = band_y1 + PHASE_GAP

        legend_h = 46
        canvas_h = y - PHASE_GAP + MARGIN + legend_h
        return canvas_w, canvas_h

    # ---------- 绘制 ----------
    def render(self, out_path):
        W, H = self.layout()
        S = self.S
        img = Image.new("RGB", (int(W * S), int(H * S)), "#FFFFFF")
        dr = ImageDraw.Draw(img)

        # 标题 + NIO 渐变标线
        if self.d.get("title"):
            x0, y0 = 48 * S, 40 * S
            for i in range(56):
                t = i / 55
                c = tuple(int(a + (b - a) * t) for a, b in
                          zip((0, 212, 212), (0, 190, 190)))
                dr.rectangle([x0 + i * S, y0 - 14 * S, x0 + (i + 1) * S, y0 - 10 * S], fill=c)
            dr.text((x0, y0 - 4 * S), self.d["title"], font=self.f_title, fill=INK1)

        # 阶段容器
        for bx0, by0, bx1, by1, label, hint in self.phase_boxes:
            dr.rounded_rectangle([bx0 * S, by0 * S, bx1 * S, by1 * S], radius=10 * S,
                                 fill=CLUSTER_FILL, outline=CLUSTER_BORDER, width=max(1, S // 2))
            lw = self.f_phase.getlength(label)
            lx = (bx0 + bx1) / 2 * S - lw / 2
            dr.text((lx, (by0 + 14) * S), label, font=self.f_phase, fill=INK1,
                    stroke_width=max(1, S // 2), stroke_fill=INK1)

        # 连线（画在节点之下；标签收集起来最后画，避免被节点遮挡）
        label_ops = []
        for e in self.d.get("edges", []):
            a, b = self.geo.get(e.get("from")), self.geo.get(e.get("to"))
            if not a or not b:
                continue
            dx, dy = b["cx"] - a["cx"], b["cy"] - a["cy"]
            if abs(dy) >= abs(dx):
                sgn = 1 if dy >= 0 else -1
                p1 = (a["cx"], a["cy"] + sgn * a["h"] / 2)
                p2 = (b["cx"], b["cy"] - sgn * b["h"] / 2)
                k = max(24, min(120, abs(p2[1] - p1[1]) * 0.4)) * sgn
                c1, c2 = (p1[0], p1[1] + k), (p2[0], p2[1] - k)
            else:
                sgn = 1 if dx >= 0 else -1
                p1 = (a["cx"] + sgn * a["w"] / 2, a["cy"])
                p2 = (b["cx"] - sgn * b["w"] / 2, b["cy"])
                k = max(24, min(120, abs(p2[0] - p1[0]) * 0.4)) * sgn
                c1, c2 = (p1[0] + k, p1[1]), (p2[0] - k, p2[1])
            pts = [(x * S, y * S) for x, y in
                   bezier_points((p1[0], p1[1]), c1, c2, (p2[0], p2[1]))]
            dashed = e.get("style") == "dotted"
            draw_polyline(dr, pts, LINE_COLOR, max(2, int(1.4 * S)), dashed=dashed,
                          dash=(6 * S, 5 * S))
            # 箭头
            (x1, y1), (x2, y2) = pts[-3], pts[-1]
            ang = math.atan2(y2 - y1, x2 - x1)
            L, HW = 9 * S, 5 * S
            tip = (x2, y2)
            base = (x2 - L * math.cos(ang), y2 - L * math.sin(ang))
            left = (base[0] - HW * math.sin(ang) * -1, base[1] - HW * math.cos(ang))
            right = (base[0] + HW * math.sin(ang) * -1, base[1] + HW * math.cos(ang))
            dr.polygon([tip, left, right], fill=LINE_COLOR)
            # 标签（横向连线的标签上移到线上方，避免挤进节点间隙）
            lbl = (e.get("label") or "").strip()
            if lbl:
                label_ops.append((pts, abs(dx) > abs(dy), lbl))

        # 节点
        for nid, g in self.geo.items():
            node = self.d["nodes"][nid]
            tag = self.tag_of(node)
            x0, y0 = g["x"] * S, g["y"] * S
            x1, y1 = (g["x"] + g["w"]) * S, (g["y"] + g["h"]) * S
            bw = max(2, int(1.4 * S))
            if tag.get("shape") == "diamond":
                cx, cy = g["cx"] * S, g["cy"] * S
                pts = [(cx, y0), (x1, cy), (cx, y1), (x0, cy)]
                dr.polygon(pts, fill=tag["fill"])
                draw_polyline(dr, pts + [pts[0]], tag["border"], bw,
                              dashed=bool(tag.get("dashed")), dash=(5 * S, 4 * S))
            else:
                dr.rounded_rectangle([x0, y0, x1, y1], radius=7 * S,
                                     fill=tag["fill"], outline=tag["border"], width=bw)
            ty = g["cy"] * S - len(g["lines"]) * 10 * S
            for line in g["lines"]:
                tw = self.f_node.getlength(line)
                dr.text((g["cx"] * S - tw / 2, ty), line, font=self.f_node, fill=tag["text"])
                ty += 20 * S

        # 连线标签（最上层；沿曲线滑动找不压节点的位置）
        node_rects = [((g["x"] - 4) * S, (g["y"] - 4) * S,
                       (g["x"] + g["w"] + 4) * S, (g["y"] + g["h"] + 4) * S)
                      for g in self.geo.values()]

        def overlaps(r):
            return any(r[0] < nr[2] and r[2] > nr[0] and r[1] < nr[3] and r[3] > nr[1]
                       for nr in node_rects)

        for pts, horizontal, lbl in label_ops:
            tw = self.f_label.getlength(lbl)
            pad = 6 * S
            w2, h2 = tw / 2 + pad, 10 * S
            mx, my = pts[len(pts) // 2]
            for t in (0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82, 0.12, 0.88):
                x, y = pts[int(t * (len(pts) - 1))]
                if horizontal:
                    y -= 22 * S
                if not overlaps((x - w2, y - h2, x + w2, y + h2)):
                    mx, my = x, y
                    break
            else:
                if horizontal:
                    my -= 22 * S
            dr.rounded_rectangle([mx - w2, my - h2, mx + w2, my + h2],
                                 radius=5 * S, fill=LABEL_BG, outline=LABEL_BORDER,
                                 width=max(1, S // 2))
            dr.text((mx - tw / 2, my - 8 * S), lbl, font=self.f_label, fill=INK3)

        # 图例（只列实际用到的分类）
        used = []
        for n in self.d.get("nodes", {}).values():
            t = self.tag_of(n)
            if t not in used:
                used.append(t)
        lx, ly = 48 * S, (H - 40) * S
        for t in used:
            dr.rounded_rectangle([lx, ly, lx + 14 * S, ly + 14 * S], radius=4 * S,
                                 fill=t["fill"], outline=t["border"], width=max(1, S // 2))
            dr.text((lx + 20 * S, ly - 1 * S), t["label"], font=self.f_hint, fill=INK3)
            lx += 20 * S + self.f_hint.getlength(t["label"]) + 26 * S

        img.save(out_path)
        print(f"已输出：{out_path}（{img.width}x{img.height} @{S}x）")


def main():
    argv = sys.argv[1:]
    opts = {"scale": 2, "max_width": 960, "font": None}
    pos = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--scale":
            i += 1; opts["scale"] = int(argv[i])
        elif a == "--max-width":
            i += 1; opts["max_width"] = int(argv[i])
        elif a == "--font":
            i += 1; opts["font"] = argv[i]
        else:
            pos.append(a)
        i += 1
    if not pos:
        sys.exit(__doc__)
    data = json.load(open(pos[0], encoding="utf-8"))
    if not (data.get("nodes") and data.get("phases") is not None):
        sys.exit("JSON 结构不对：需要包含 nodes / edges / phases（与页面「导出 JSON」一致）")
    out = pos[1] if len(pos) > 1 else "flow.png"
    Renderer(data, scale=opts["scale"], max_row_w=opts["max_width"],
             font_path=opts["font"]).render(out)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
把 Noto Sans SC 裁剪成本片实际用到的字形。

完整的简体子集每个字重 1.1MB，三个字重 3.4MB。Remotion 渲染时会周期性重启
浏览器标签页，每次重启都要重新加载全部字体，在多进程渲染的 CPU 争抢下
很容易超过 delayRender 的默认 28s 超时，导致整片渲染中断。
裁剪到只保留用到的字后，体积降到几十 KB，问题消失。

用法: python3 scripts/subset-fonts.py
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
NODE_FONTS = ROOT / "node_modules/@fontsource/noto-sans-sc/files"
OUT = ROOT / "public/fonts"
WEIGHTS = ["400", "500", "700"]

# 从源码里取出所有出现过的字符（含注释，多包一点无所谓，代价极小），
# 再补上一批常用标点，避免漏字导致渲染出方框。
EXTRA = "0123456789·—…→×？，。、（）：；！%+-/" "　 "

chars = set(EXTRA)
for path in list(SRC.rglob("*.tsx")) + list(SRC.rglob("*.ts")):
    chars |= set(path.read_text(encoding="utf-8"))

text = "".join(sorted(c for c in chars if c.isprintable() and c != " "))
print(f"需要保留 {len(text)} 个字形")

OUT.mkdir(parents=True, exist_ok=True)
total = 0
for weight in WEIGHTS:
    src = NODE_FONTS / f"noto-sans-sc-chinese-simplified-{weight}-normal.woff2"
    if not src.exists():
        sys.exit(f"缺少字体源文件: {src}")
    dst = OUT / f"noto-sans-sc-{weight}.woff2"
    subprocess.run(
        [
            sys.executable, "-m", "fontTools.subset", str(src),
            f"--text={text}",
            "--flavor=woff2",
            "--layout-features=*",
            f"--output-file={dst}",
        ],
        check=True,
    )
    size = dst.stat().st_size
    total += size
    print(f"  {weight}: {src.stat().st_size / 1024:.0f}KB → {size / 1024:.1f}KB")

print(f"合计 {total / 1024:.1f}KB")

#!/usr/bin/env python3
"""
Render PNG stills from raw PTY byte captures (the .bin files from
record-cast.py / pty captures). Decodes the stream into a cell grid with
colors, then draws with PIL using SF Mono.

Usage:
  python3 scripts/cast-shot.py <input.bin> <out.png> [--cols N] [--rows N]
          [--at seconds] [--scale 2]

--at seeks to a timestamp? Not possible without timing; .bin captures are
pure byte streams, so this renders the FINAL screen state. For mid-video
stills, cut the .bin at the right offset or record separate captures.
"""
import argparse
import re
import sys
from PIL import Image, ImageDraw, ImageFont

FONT = '/System/Library/Fonts/SFNSMono.ttf'

DEFAULT_FG = (232, 238, 247)
DEFAULT_BG = (11, 15, 20)


def parse_color(code: str | None):
    if not code:
        return None
    if code.startswith('#'):
        code = code[1:]
        if len(code) == 6:
            return tuple(int(code[i:i+2], 16) for i in (0, 2, 4))
    return None


def clamp(v):
    return max(0, min(255, v))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input')
    ap.add_argument('output')
    ap.add_argument('--cols', type=int, default=100)
    ap.add_argument('--rows', type=int, default=30)
    ap.add_argument('--scale', type=int, default=2)
    args = ap.parse_args()

    W, H = args.cols, args.rows
    grid = [[(' ', DEFAULT_FG, DEFAULT_BG) for _ in range(W)] for _ in range(H)]
    x = y = 0
    fg, bg = DEFAULT_FG, DEFAULT_BG

    data = open(args.input, 'rb').read().decode('utf-8', 'replace')
    i = 0
    while i < len(data):
        m = re.match(r'\x1b\[(\d*);?(\d*)H', data[i:])
        if m:
            row = int(m.group(1) or 1) - 1
            col = int(m.group(2) or 1) - 1
            if 0 <= row < H:
                y = row
            if 0 <= col < W:
                x = col
            i += m.end()
            continue
        m = re.match(r'\x1b\[2J', data[i:])
        if m:
            grid = [[(' ', DEFAULT_FG, DEFAULT_BG) for _ in range(W)] for _ in range(H)]
            i += m.end()
            continue
        m = re.match(r'\x1b\[(\??[0-9;<>]*)([hl])', data[i:])  # mode set/reset
        if m:
            i += m.end()
            continue
        m = re.match(r'\x1b\[([0-9;]*)m', data[i:])
        if m:
            params = m.group(1)
            if params in ('', '0'):
                fg, bg = DEFAULT_FG, DEFAULT_BG
            else:
                parts = params.split(';')
                j = 0
                while j < len(parts):
                    p = parts[j]
                    if p == '0':
                        fg, bg = DEFAULT_FG, DEFAULT_BG
                    elif p in ('30', '31', '32', '33', '34', '35', '36', '37'):
                        basic = [(170,170,170),(221,106,84),(137,192,124),(226,193,89),(110,158,235),(211,134,155),(139,217,216),(232,238,247)]
                        fg = basic[int(p) - 30]
                    elif p in ('90','91','92','93','94','95','96','97'):
                        basic = [(108,122,140),(231,130,120),(158,209,148),(240,215,133),(140,180,240),(230,160,180),(170,230,230),(240,244,250)]
                        fg = basic[int(p) - 90]
                    elif p in ('40','41','42','43','44','45','46','47'):
                        basic = [(20,24,31),(60,30,28),(32,48,34),(64,52,26),(30,40,62),(56,36,50),(32,50,52),(40,48,60)]
                        bg = basic[int(p) - 40]
                    elif p == '38' and j + 1 < len(parts):
                        if parts[j+1] == '2' and j + 4 < len(parts):
                            fg = tuple(int(v) for v in parts[j+2:j+5])
                            j += 4
                        elif parts[j+1] == '5' and j + 2 < len(parts):
                            fg = ansi256(int(parts[j+2]))
                            j += 2
                    elif p == '48' and j + 1 < len(parts):
                        if parts[j+1] == '2' and j + 4 < len(parts):
                            bg = tuple(int(v) for v in parts[j+2:j+5])
                            j += 4
                        elif parts[j+1] == '5' and j + 2 < len(parts):
                            bg = ansi256(int(parts[j+2]))
                            j += 2
                    j += 1
            i += m.end()
            continue
        m = re.match(r'\x1b\[[0-9;:<>=?]*[A-Za-z]', data[i:])  # other CSI
        if m:
            i += m.end()
            continue
        m = re.match(r'\x1b[()][A-Z0-9]', data[i:])
        if m:
            i += m.end()
            continue
        if data[i] == '\x1b':
            i += 1
            continue
        ch = data[i]
        if ch == '\r':
            x = 0
        elif ch == '\n':
            y = min(H - 1, y + 1)
        elif ch >= ' ':
            if y < H and x < W:
                grid[y][x] = (ch, fg, bg)
            if x < W - 1:
                x += 1
        i += 1

    font_size = 15
    font = ImageFont.truetype(FONT, font_size)
    cell_w = int(font_size * 0.62)
    cell_h = int(font_size * 1.32)
    pad = 12
    img = Image.new('RGB', (pad*2 + cell_w*W, pad*2 + cell_h*H), (7, 10, 14))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(
        [2, 2, img.width-3, img.height-3], radius=10, outline=(36, 48, 65), width=1
    )
    for row in range(H):
        for col in range(W):
            ch, fgc, bgc = grid[row][col]
            px = pad + col * cell_w
            py = pad + row * cell_h
            if bgc != DEFAULT_BG:
                draw.rectangle([px, py, px+cell_w-1, py+cell_h-1], fill=bgc)
            if ch != ' ':
                draw.text((px, py), ch, font=font, fill=fgc)
    if args.scale != 1:
        img = img.resize((img.width*args.scale, img.height*args.scale), Image.LANCZOS)
    img.save(args.output)
    print(f'rendered {args.output} ({img.width}x{img.height})')


def ansi256(idx: int):
    if idx < 16:
        basic = [(170,170,170),(221,106,84),(137,192,124),(226,193,89),(110,158,235),(211,134,155),(139,217,216),(232,238,247),
                 (108,122,140),(231,130,120),(158,209,148),(240,215,133),(140,180,240),(230,160,180),(170,230,230),(240,244,250)]
        return basic[idx]
    if idx < 232:
        idx -= 16
        r, g, b = idx // 36, (idx % 36) // 6, idx % 6
        return tuple(int(v * 255 / 5) if v else 0 for v in (r, g, b))
    v = 8 + (idx - 232) * 10
    return (v, v, v)


if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python3
"""Capture kit workbench grids from a real PTY and replay CUP onto a cell grid."""

from __future__ import annotations

import fcntl
import os
import pty
import select
import struct
import sys
import termios
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "apps" / "demo"
OUT = ROOT / "docs" / "evidence"
BUN = os.environ.get("BUN", "bun")


def set_winsize(fd: int, rows: int, cols: int) -> None:
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))


def drain(fd: int, seconds: float) -> bytes:
    end = time.time() + seconds
    chunks: list[bytes] = []
    while time.time() < end:
        remaining = end - time.time()
        ready, _, _ = select.select([fd], [], [], max(0.01, remaining))
        if not ready:
            continue
        try:
            chunk = os.read(fd, 65536)
        except OSError:
            break
        if not chunk:
            break
        chunks.append(chunk)
    return b"".join(chunks)


def replay(raw: bytes, cols: int, rows: int) -> str:
    text = raw.decode("utf-8", "replace")
    grid = [[" " for _ in range(cols)] for _ in range(rows)]
    row = 0
    col = 0
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "\x1b":
            i += 1
            if i >= n:
                break
            nxt = text[i]
            if nxt == "[":
                i += 1
                start = i
                while i < n and not ("@" <= text[i] <= "~"):
                    i += 1
                if i >= n:
                    break
                final = text[i]
                body = text[start:i]
                i += 1
                if final == "H" or final == "f":
                    parts = body.split(";") if body else []
                    r = int(parts[0]) if parts and parts[0] else 1
                    c = int(parts[1]) if len(parts) > 1 and parts[1] else 1
                    row = max(0, min(rows - 1, r - 1))
                    col = max(0, min(cols - 1, c - 1))
                elif final == "J":
                    mode = int(body) if body else 0
                    if mode == 2:
                        grid = [[" " for _ in range(cols)] for _ in range(rows)]
                        row, col = 0, 0
                elif final == "K":
                    for x in range(col, cols):
                        grid[row][x] = " "
                continue
            if nxt == "]":
                i += 1
                while i < n and text[i] not in "\x07":
                    if text[i] == "\x1b" and i + 1 < n and text[i + 1] == "\\":
                        i += 2
                        break
                    i += 1
                else:
                    if i < n:
                        i += 1
                continue
            i += 1
            continue
        if ch == "\r":
            col = 0
            i += 1
            continue
        if ch == "\n":
            row = min(rows - 1, row + 1)
            col = 0
            i += 1
            continue
        if ch == "\x08":
            col = max(0, col - 1)
            i += 1
            continue
        if ch == "\x00" or ch == "\x07":
            i += 1
            continue
        if ord(ch) < 32:
            i += 1
            continue
        if 0 <= row < rows and 0 <= col < cols:
            grid[row][col] = ch
        col += 1
        if col >= cols:
            col = 0
            row = min(rows - 1, row + 1)
        i += 1
    return "\n".join("".join(line) for line in grid)


def capture(cols: int, rows: int, keys: bytes, name: str) -> str:
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(DEMO)
        os.environ["TERM"] = "xterm-256color"
        os.environ["COLUMNS"] = str(cols)
        os.environ["LINES"] = str(rows)
        os.execvp(BUN, [BUN, "src/index.ts", "kit"])
        raise SystemExit(1)
    set_winsize(fd, rows, cols)
    raw = drain(fd, 0.7)
    if keys:
        os.write(fd, keys)
        raw += drain(fd, 0.45)
    os.close(fd)
    try:
        os.waitpid(pid, 0)
    except ChildProcessError:
        pass
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{name}.bin").write_bytes(raw)
    grid = replay(raw, cols, rows)
    (OUT / f"{name}.txt").write_text(grid + "\n")
    print(f"wrote {name} ({len(raw)} bytes, {cols}x{rows})")
    return grid


def main() -> int:
    capture(80, 24, b"", "kit-80x24-idle")
    capture(80, 24, b"\t", "kit-80x24-tab")
    capture(80, 24, b"hello", "kit-80x24-type")
    capture(80, 24, b"/", "kit-80x24-slash")
    capture(80, 24, b"?", "kit-80x24-help")
    capture(120, 40, b"", "kit-120x40-idle")
    return 0


if __name__ == "__main__":
    sys.exit(main())

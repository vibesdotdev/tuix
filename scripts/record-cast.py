#!/usr/bin/env python3
"""
Record a Tuix demo app as an asciinema v2 cast (plus raw PTY bytes).

Usage:
  python3 scripts/record-cast.py <command> <out-prefix> [script-file]

The script file is a list of steps, one per line:
  wait <seconds>            — idle time
  type "text"               — type a string with human-ish delays
  key <escape-name>         — send a key (tab, enter, esc, up, down...)
  sleep <seconds>           — alias of wait
Lines starting with # are comments.
"""
import fcntl
import json
import os
import pty
import select
import signal
import struct
import sys
import termios
import time

KEYS = {
    'tab': b'\t',
    'enter': b'\r',
    'return': b'\r',
    'esc': b'\x1b',
    'escape': b'\x1b',
    'up': b'\x1b[A',
    'down': b'\x1b[B',
    'right': b'\x1b[C',
    'left': b'\x1b[D',
    'backspace': b'\x7f',
    'space': b' ',
    'ctrl+c': b'\x03',
    'slash': b'/',
}

COLS, ROWS = 100, 30


def main():
    command = sys.argv[1]        # e.g. "kit"
    prefix = sys.argv[2]         # e.g. docs/evidence/casts/kit
    script_path = sys.argv[3] if len(sys.argv) > 3 else None

    steps = []
    if script_path:
        for line in open(script_path):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split(None, 1)
            steps.append((parts[0], parts[1] if len(parts) > 1 else ''))

    os.makedirs(os.path.dirname(prefix), exist_ok=True)
    cast_path = prefix + '.cast'
    bin_path = prefix + '.bin'

    pid, fd = pty.fork()
    if pid == 0:
        os.environ['TERM'] = 'xterm-256color'
        os.environ.pop('TUIX_DEBUG_KEYS', None)
        os.environ.pop('TUIX_DEBUG_MOUSE', None)
        # Run from repo root so workspace tsconfig.json (jsxImportSource) is found
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        os.chdir(repo_root)
        demo = os.path.join('apps', 'demo')
        os.execvp('bun', ['bun', os.path.join(demo, 'src', 'index.ts'), command])

    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', ROWS, COLS, 0, 0))

    cast = open(cast_path, 'w')
    cast.write(json.dumps({
        'version': 2,
        'width': COLS,
        'height': ROWS,
        'timestamp': int(time.time()),
        'env': {'TERM': 'xterm-256color', 'SHELL': '/bin/zsh'},
    }) + '\n')

    raw = open(bin_path, 'wb')
    t0 = time.time()
    dead = False

    def drain(duration):
        """Read output for `duration` seconds, writing cast events."""
        nonlocal dead
        end = time.time() + duration
        while time.time() < end:
            r, _, _ = select.select([fd], [], [], min(0.05, end - time.time()))
            if r:
                try:
                    chunk = os.read(fd, 65536)
                except OSError:
                    dead = True
                    return
                if not chunk:
                    dead = True
                    return
                raw.write(chunk)
                cast.write(json.dumps(['o', round(time.time() - t0, 3), chunk.decode('utf-8', 'replace')]) + '\n')

    def send(data: bytes):
        try:
            os.write(fd, data)
        except OSError:
            pass

    try:
        drain(2.0)  # boot
        for op, arg in steps:
            if dead:
                break
            if op in ('wait', 'sleep'):
                drain(float(arg))
            elif op == 'type':
                text = json.loads(arg) if arg.startswith('"') else arg
                for ch in text:
                    send(ch.encode())
                    drain(0.06 + 0.05 * (ch in 'aeiou '))
            elif op == 'raw':
                send(arg.encode())
            elif op == 'key':
                name = arg.lower()
                send(KEYS.get(name, name.encode()))
                drain(0.45)
        drain(1.0)  # settle
        if not dead:
            send(b'\x03')
            drain(0.8)
    finally:
        cast.close()
        raw.close()
        try:
            os.kill(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        try:
            os.waitpid(pid, 0)
        except ChildProcessError:
            pass

    size = os.path.getsize(cast_path)
    print(f'recorded {cast_path} ({size} bytes)')


if __name__ == '__main__':
    main()

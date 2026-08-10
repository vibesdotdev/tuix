/**
 * Production PTY path for interactive TTY processes.
 * Uses node-pty as interim Bun-compatible PTY (see BUN_CAPABILITY_MATRIX).
 * Pure interface + factory so tests can mock the backend.
 */

export interface PtySize {
  cols: number
  rows: number
}

export interface PtySpawnOptions {
  cwd?: string
  env?: Record<string, string>
  name?: string
  cols?: number
  rows?: number
}

export interface PtyHandle {
  readonly pid: number
  write(data: string): void
  resize(cols: number, rows: number): void
  onData(listener: (data: string) => void): () => void
  onExit(listener: (code: number, signal?: number) => void): () => void
  kill(signal?: string): void
}

export interface PtyBackend {
  spawn(file: string, args: string[], options: PtySpawnOptions): PtyHandle
}

type NodePtyModule = {
  spawn: (
    file: string,
    args: string[] | string,
    options: {
      name?: string
      cols?: number
      rows?: number
      cwd?: string
      env?: Record<string, string>
    }
  ) => {
    pid: number
    write: (data: string) => void
    resize: (cols: number, rows: number) => void
    onData: (cb: (data: string) => void) => void
    onExit: (cb: (e: { exitCode: number; signal?: number }) => void) => void
    kill: (signal?: string) => void
  }
}

let cachedBackend: PtyBackend | null = null

/**
 * Create a PtyHandle from a node-pty IPty-like object.
 */
export function wrapNodePty(pty: {
  pid: number
  write: (data: string) => void
  resize: (cols: number, rows: number) => void
  onData: (cb: (data: string) => void) => void
  onExit: (cb: (e: { exitCode: number; signal?: number }) => void) => void
  kill: (signal?: string) => void
}): PtyHandle {
  return {
    get pid() {
      return pty.pid
    },
    write(data: string) {
      pty.write(data)
    },
    resize(cols: number, rows: number) {
      pty.resize(cols, rows)
    },
    onData(listener) {
      pty.onData(listener)
      return () => {
        /* node-pty has no off; listeners live until process exit */
      }
    },
    onExit(listener) {
      pty.onExit(e => listener(e.exitCode, e.signal))
      return () => {}
    },
    kill(signal?: string) {
      pty.kill(signal)
    },
  }
}

/**
 * Load node-pty backend (lazy). Throws if module cannot load (ABI mismatch).
 */
export function createNodePtyBackend(): PtyBackend {
  // Dynamic require/import of node-pty
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodePty = require('node-pty') as NodePtyModule
  return {
    spawn(file, args, options) {
      const proc = nodePty.spawn(file, args, {
        name: options.name ?? 'xterm-256color',
        cols: options.cols ?? 80,
        rows: options.rows ?? 24,
        cwd: options.cwd,
        env: options.env ?? (process.env as Record<string, string>),
      })
      return wrapNodePty(proc)
    },
  }
}

/**
 * Default backend accessor — uses node-pty when available.
 */
export function getDefaultPtyBackend(): PtyBackend {
  if (!cachedBackend) {
    cachedBackend = createNodePtyBackend()
  }
  return cachedBackend
}

/** Override backend (tests). */
export function setDefaultPtyBackend(backend: PtyBackend | null): void {
  cachedBackend = backend
}

/**
 * Spawn an interactive PTY process.
 */
export function spawnPty(
  file: string,
  args: string[] = [],
  options: PtySpawnOptions = {},
  backend: PtyBackend = getDefaultPtyBackend()
): PtyHandle {
  return backend.spawn(file, args, options)
}

/**
 * In-memory mock PTY for unit tests (no native deps).
 */
export function createMockPtyBackend(): PtyBackend & {
  lastSpawn?: { file: string; args: string[]; options: PtySpawnOptions }
  handles: MockPtyHandle[]
} {
  const handles: MockPtyHandle[] = []
  const backend = {
    handles,
    lastSpawn: undefined as { file: string; args: string[]; options: PtySpawnOptions } | undefined,
    spawn(file: string, args: string[], options: PtySpawnOptions): PtyHandle {
      backend.lastSpawn = { file, args, options }
      const h = new MockPtyHandle(options.cols ?? 80, options.rows ?? 24)
      handles.push(h)
      return h
    },
  }
  return backend
}

export class MockPtyHandle implements PtyHandle {
  pid = 4242
  cols: number
  rows: number
  written: string[] = []
  private dataListeners = new Set<(d: string) => void>()
  private exitListeners = new Set<(code: number, signal?: number) => void>()
  killed = false

  constructor(cols = 80, rows = 24) {
    this.cols = cols
    this.rows = rows
  }

  write(data: string) {
    this.written.push(data)
  }

  resize(cols: number, rows: number) {
    this.cols = cols
    this.rows = rows
  }

  onData(listener: (data: string) => void) {
    this.dataListeners.add(listener)
    return () => this.dataListeners.delete(listener)
  }

  onExit(listener: (code: number, signal?: number) => void) {
    this.exitListeners.add(listener)
    return () => this.exitListeners.delete(listener)
  }

  kill(_signal?: string) {
    this.killed = true
    for (const l of this.exitListeners) l(0)
  }

  /** Test helper: emit data to listeners */
  emitData(data: string) {
    for (const l of this.dataListeners) l(data)
  }
}

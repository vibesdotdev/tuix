import { test, expect, describe } from 'bun:test'
import {
  createMockPtyBackend,
  spawnPty,
  setDefaultPtyBackend,
  wrapNodePty,
  MockPtyHandle,
} from './pty'

describe('PTY production path', () => {
  test('spawn via mock backend records file/args and supports write/resize', () => {
    const backend = createMockPtyBackend()
    setDefaultPtyBackend(backend)
    try {
      const handle = spawnPty('/bin/sh', ['-c', 'echo hi'], {
        cols: 100,
        rows: 30,
        cwd: '/tmp',
      })
      expect(backend.lastSpawn?.file).toBe('/bin/sh')
      expect(backend.lastSpawn?.args).toEqual(['-c', 'echo hi'])
      expect(backend.lastSpawn?.options.cols).toBe(100)
      handle.write('input\n')
      handle.resize(120, 40)
      const mock = backend.handles[0]!
      expect(mock.written).toEqual(['input\n'])
      expect(mock.cols).toBe(120)
      expect(mock.rows).toBe(40)
    } finally {
      setDefaultPtyBackend(null)
    }
  })

  test('onData and kill work on mock handle', () => {
    const h = new MockPtyHandle()
    const chunks: string[] = []
    h.onData(d => chunks.push(d))
    let exitCode: number | undefined
    h.onExit(c => {
      exitCode = c
    })
    h.emitData('hello')
    expect(chunks).toEqual(['hello'])
    h.kill()
    expect(h.killed).toBe(true)
    expect(exitCode).toBe(0)
  })

  test('wrapNodePty adapts node-pty-like object', () => {
    const written: string[] = []
    let resized: [number, number] | null = null
    const fake = {
      pid: 99,
      write: (d: string) => written.push(d),
      resize: (c: number, r: number) => {
        resized = [c, r]
      },
      onData: (_cb: (d: string) => void) => {},
      onExit: (_cb: (e: { exitCode: number; signal?: number }) => void) => {},
      kill: () => {},
    }
    const h = wrapNodePty(fake)
    expect(h.pid).toBe(99)
    h.write('x')
    h.resize(1, 2)
    expect(written).toEqual(['x'])
    expect(resized).toEqual([1, 2])
  })
})

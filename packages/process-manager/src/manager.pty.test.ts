/**
 * Production ProcessManager PTY path — drives shared start() API with config.pty.
 */
import { test, expect, describe, afterEach } from 'bun:test'
import { ProcessManager } from './manager'
import { createMockPtyBackend, setDefaultPtyBackend } from './pty/pty'

describe('ProcessManager production PTY path', () => {
  afterEach(() => {
    setDefaultPtyBackend(null)
  })

  test('start with config.pty uses spawnPty backend', async () => {
    const backend = createMockPtyBackend()
    setDefaultPtyBackend(backend)

    const pm = new ProcessManager({ debugTuix: false })
    await pm.init()
    await pm.add({
      name: 'shell-pty',
      command: '/bin/sh',
      args: ['-c', 'echo hi'],
      autostart: false,
      pty: true,
      ptyCols: 100,
      ptyRows: 30,
    })
    await pm.start('shell-pty')

    expect(backend.lastSpawn?.file).toBeTruthy()
    expect(backend.lastSpawn?.options.cols).toBe(100)
    expect(backend.lastSpawn?.options.rows).toBe(30)
    expect(backend.handles.length).toBe(1)

    const state = pm.list().find(p => p.name === 'shell-pty')
    expect(state?.status).toBe('running')

    // Production write/resize surface apps call
    pm.writePty('shell-pty', 'input\n')
    pm.resizePty('shell-pty', 120, 40)
    const handle = pm.getPty('shell-pty')
    expect(handle).toBeDefined()
    const mock = backend.handles[0]!
    expect(mock.written).toEqual(['input\n'])
    expect(mock.cols).toBe(120)
    expect(mock.rows).toBe(40)
  })

  test('writePty/resizePty throw when process is not PTY', async () => {
    const pm = new ProcessManager({ debugTuix: false })
    await pm.init()
    await pm.add({
      name: 'no-pty',
      command: 'true',
      args: [],
      autostart: false,
      pty: false,
    })
    expect(() => pm.writePty('no-pty', 'x')).toThrow(/not a running PTY/)
    expect(() => pm.resizePty('no-pty', 1, 1)).toThrow(/not a running PTY/)
  })

  test('start without pty uses Bun.spawn path (no PTY backend spawn)', async () => {
    const backend = createMockPtyBackend()
    setDefaultPtyBackend(backend)

    const pm = new ProcessManager({ debugTuix: false })
    await pm.init()
    // Use a no-op that exits quickly if spawn happens
    await pm.add({
      name: 'echo-pipe',
      command: 'true',
      args: [],
      autostart: false,
      pty: false,
    })
    try {
      await pm.start('echo-pipe')
    } catch {
      // true may not resolve on all systems; still assert no PTY
    }
    expect(backend.handles.length).toBe(0)
  })
})

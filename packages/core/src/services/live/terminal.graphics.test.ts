import { test, expect, describe } from 'bun:test'
import { Effect, Layer } from 'effect'
import { TerminalService } from '../terminal'
import { TerminalServiceLive } from './terminal'

describe('TerminalService.writeGraphics', () => {
  test('returns fallback none when caps lack graphics', async () => {
    const prev = process.env.TERM_PROGRAM
    delete process.env.TERM_PROGRAM
    process.env.TERM = 'dumb'
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const term = yield* TerminalService
          return yield* term.writeGraphics({
            data: new Uint8Array(8 * 6).fill(200),
            width: 8,
            height: 6,
            channels: 1,
            format: 'gray',
          })
        }).pipe(Effect.provide(TerminalServiceLive))
      )
      expect(result.fallback).toBe(true)
      expect(result.protocol).toBe('none')
    } finally {
      if (prev !== undefined) process.env.TERM_PROGRAM = prev
      else delete process.env.TERM_PROGRAM
    }
  })

  test('writes sixel when WezTerm caps claim sixel', async () => {
    const prev = process.env.TERM_PROGRAM
    process.env.TERM_PROGRAM = 'WezTerm'
    process.env.TERM = 'xterm-256color'
    try {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const term = yield* TerminalService
          return yield* term.writeGraphics({
            data: new Uint8Array(8 * 6).fill(200),
            width: 8,
            height: 6,
            channels: 1,
            format: 'gray',
          })
        }).pipe(Effect.provide(TerminalServiceLive))
      )
      expect(result.fallback).toBe(false)
      expect(result.protocol).toBe('sixel')
    } finally {
      if (prev !== undefined) process.env.TERM_PROGRAM = prev
      else delete process.env.TERM_PROGRAM
    }
  })
})

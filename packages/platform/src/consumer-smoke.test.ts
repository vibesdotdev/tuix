import { test, expect } from 'bun:test'
import { $state, $states } from '@tuix/reactive'
import {
  detectInteractive,
  extractModel,
  compileToComponent,
} from '../../jsx/src/compiler/jsx-to-component.ts'
import { Effect } from 'effect'
import { PLATFORM_VERSION, detectCapabilities, encodeGraphics, LiveServices } from './index'

test('consumer public path: named $state extractModel under Bun', async () => {
  function Counter() {
    const count = $state(0, 'count')
    return count
  }
  expect(detectInteractive(Counter)).toBe(true)
  const model = extractModel(Counter, { extractState: true }) as { count: number }
  expect(model.count).toBe(0)

  function Multi() {
    return $states({ count: 1, label: 'hi' })
  }
  expect(extractModel(Multi, { extractState: true })).toEqual({ count: 1, label: 'hi' })

  const [init] = await Effect.runPromise(compileToComponent(Counter, { extractState: true }).init)
  expect((init as { count: number }).count).toBe(0)

  expect(PLATFORM_VERSION).toBeTruthy()
  expect(LiveServices).toBeDefined()
  const caps = detectCapabilities({ env: { TERM_PROGRAM: 'WezTerm' }, columns: 80, rows: 24 })
  expect(caps.sixel).toBe(true)
  const g = encodeGraphics(caps, {
    data: new Uint8Array(48).fill(200),
    width: 8,
    height: 6,
    channels: 1,
    format: 'gray',
  })
  expect(g.fallback).toBe(false)
  expect(g.protocol).toBe('sixel')
})

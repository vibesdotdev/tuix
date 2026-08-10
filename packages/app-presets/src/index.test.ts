import { describe, expect, test } from 'bun:test'
import { presets } from './index'

describe('@tuix/app-presets', () => {
  test('builds standard module factory list with defaults', () => {
    const factories = presets.standard()
    expect(factories.length).toBe(2)
  })

  test('includes optional factories when enabled', () => {
    const factories = presets.standard({ processManager: true, coordination: true })
    expect(factories.length).toBe(4)
  })
})

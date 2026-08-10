import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { parseYamlValue, serializeYamlValue, parseTomlValue, serializeTomlValue } from './yaml-toml'
import { parseYAML, serializeYAML, parseTOML, serializeTOML } from './formats'

describe('YAML config', () => {
  test('round-trip nested map and list', async () => {
    const data = {
      name: 'tuix',
      port: 3000,
      features: { jsx: true, mvu: true },
    }
    const yaml = serializeYamlValue(data)
    expect(yaml).toContain('name: tuix')
    const parsed = parseYamlValue(yaml)
    expect(parsed.name).toBe('tuix')
    expect(parsed.port).toBe(3000)
    expect((parsed.features as { jsx: boolean }).jsx).toBe(true)

    const viaEffect = await Effect.runPromise(parseYAML(yaml))
    expect(viaEffect.name).toBe('tuix')
    const ser = await Effect.runPromise(serializeYAML(data))
    expect(ser).toContain('port: 3000')
  })
})

describe('TOML config', () => {
  test('round-trip tables and keys', async () => {
    const data = {
      title: 'Tuix',
      server: { host: 'localhost', port: 8080 },
    }
    const toml = serializeTomlValue(data)
    expect(toml).toContain('title = "Tuix"')
    expect(toml).toContain('[server]')
    const parsed = parseTomlValue(toml)
    expect(parsed.title).toBe('Tuix')
    expect((parsed.server as { port: number }).port).toBe(8080)

    const viaEffect = await Effect.runPromise(parseTOML(toml))
    expect(viaEffect.title).toBe('Tuix')
    const ser = await Effect.runPromise(serializeTOML(data))
    expect(ser).toContain('[server]')
  })
})

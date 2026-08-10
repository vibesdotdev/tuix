/**
 * Configuration File Formats
 *
 * Parsers and serializers for JSON, YAML, TOML, TypeScript
 */

import { Effect } from 'effect'
import type { ConfigError } from '../types'
import { parseYamlValue, serializeYamlValue, parseTomlValue, serializeTomlValue } from './yaml-toml'

export type ConfigFormat = 'json' | 'yaml' | 'toml' | 'typescript'

/**
 * Detect format from filename
 */
export function detectFormat(filename: string): ConfigFormat {
  if (filename.endsWith('.json')) return 'json'
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml'
  if (filename.endsWith('.toml')) return 'toml'
  if (filename.endsWith('.ts') || filename.endsWith('.config.ts')) return 'typescript'
  return 'json'
}

export function parseJSON(content: string): Effect.Effect<Record<string, any>, ConfigError> {
  return Effect.try({
    try: () => JSON.parse(content),
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: 'Failed to parse JSON config',
      cause: error,
    }),
  })
}

export function serializeJSON(data: Record<string, any>): Effect.Effect<string, ConfigError> {
  return Effect.try({
    try: () => JSON.stringify(data, null, 2),
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: 'Failed to serialize JSON config',
      cause: error,
    }),
  })
}

export function parseYAML(content: string): Effect.Effect<Record<string, any>, ConfigError> {
  return Effect.try({
    try: () => parseYamlValue(content) as Record<string, any>,
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: 'Failed to parse YAML config',
      cause: error,
    }),
  })
}

export function serializeYAML(data: Record<string, any>): Effect.Effect<string, ConfigError> {
  return Effect.try({
    try: () => serializeYamlValue(data) + '\n',
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: 'Failed to serialize YAML config',
      cause: error,
    }),
  })
}

export function parseTOML(content: string): Effect.Effect<Record<string, any>, ConfigError> {
  return Effect.try({
    try: () => parseTomlValue(content) as Record<string, any>,
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: 'Failed to parse TOML config',
      cause: error,
    }),
  })
}

export function serializeTOML(data: Record<string, any>): Effect.Effect<string, ConfigError> {
  return Effect.try({
    try: () => serializeTomlValue(data),
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: 'Failed to serialize TOML config',
      cause: error,
    }),
  })
}

export function parseTypeScript(filePath: string): Effect.Effect<Record<string, any>, ConfigError> {
  return Effect.tryPromise({
    try: async () => {
      const module = await import(filePath)
      return module.default || module
    },
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: `Failed to load TypeScript config from ${filePath}`,
      cause: error,
    }),
  })
}

export function loadConfigFile(filePath: string): Effect.Effect<Record<string, any>, ConfigError> {
  const format = detectFormat(filePath)

  if (format === 'typescript') {
    return parseTypeScript(filePath)
  }

  return Effect.tryPromise({
    try: async () => {
      const file = Bun.file(filePath)
      return await file.text()
    },
    catch: error => ({
      _tag: 'ConfigError' as const,
      message: `Failed to read config file: ${filePath}`,
      cause: error,
    }),
  }).pipe(
    Effect.flatMap(content => {
      switch (format) {
        case 'json':
          return parseJSON(content)
        case 'yaml':
          return parseYAML(content)
        case 'toml':
          return parseTOML(content)
        default:
          return parseJSON(content)
      }
    })
  )
}

export function saveConfigFile(
  filePath: string,
  data: Record<string, any>
): Effect.Effect<void, ConfigError> {
  const format = detectFormat(filePath)

  if (format === 'typescript') {
    return Effect.fail({
      _tag: 'ConfigError' as const,
      message: 'Cannot save to TypeScript config files',
    })
  }

  return Effect.gen(function* (_) {
    const content = yield* _(
      format === 'json'
        ? serializeJSON(data)
        : format === 'yaml'
          ? serializeYAML(data)
          : format === 'toml'
            ? serializeTOML(data)
            : serializeJSON(data)
    )

    yield* _(
      Effect.tryPromise({
        try: async () => {
          await Bun.write(filePath, content)
        },
        catch: error => ({
          _tag: 'ConfigError' as const,
          message: `Failed to write config file: ${filePath}`,
          cause: error,
        }),
      })
    )
  })
}

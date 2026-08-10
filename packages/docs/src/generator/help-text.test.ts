/**
 * @tuix/docs - Help text generation tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { generateCommandHelp, generateAppHelp } from './help-text'
import type { CommandDoc, AppDoc } from '../types'

describe('@tuix/docs - Help Text Generation', () => {
  test('generates help text for simple command', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      description: 'A test command',
    }

    const help = Effect.runSync(generateCommandHelp(doc))

    expect(help).toContain('test-cmd')
    expect(help).toContain('A test command')
  })

  test('generates help text for command with usage', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      usage: ['test-cmd <file>', 'test-cmd --help'],
    }

    const help = Effect.runSync(generateCommandHelp(doc))

    expect(help).toContain('USAGE:')
    expect(help).toContain('test-cmd <file>')
    expect(help).toContain('test-cmd --help')
  })

  test('generates help text for command with arguments', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      args: [
        { name: 'file', description: 'Input file' },
        { name: 'output', description: 'Output file' },
      ],
    }

    const help = Effect.runSync(generateCommandHelp(doc))

    expect(help).toContain('ARGUMENTS:')
    expect(help).toContain('file')
    expect(help).toContain('Input file')
    expect(help).toContain('output')
    expect(help).toContain('Output file')
  })

  test('generates help text for command with options', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      options: [
        { short: '-v', long: '--verbose', description: 'Verbose output' },
        { long: '--output', description: 'Output file' },
      ],
    }

    const help = Effect.runSync(generateCommandHelp(doc))

    expect(help).toContain('OPTIONS:')
    expect(help).toContain('-v, --verbose')
    expect(help).toContain('Verbose output')
    expect(help).toContain('--output')
    expect(help).toContain('Output file')
  })

  test('generates help text for command with examples', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      examples: [
        { description: 'Basic usage', command: 'test-cmd file.txt' },
        { description: 'With options', command: 'test-cmd -v file.txt' },
      ],
    }

    const help = Effect.runSync(generateCommandHelp(doc))

    expect(help).toContain('EXAMPLES:')
    expect(help).toContain('Basic usage')
    expect(help).toContain('test-cmd file.txt')
    expect(help).toContain('With options')
    expect(help).toContain('test-cmd -v file.txt')
  })

  test('generates help text for app', () => {
    const doc: AppDoc = {
      name: 'test-app',
      version: '1.0.0',
      description: 'A test application',
      commands: [
        { name: 'cmd1', description: 'Command 1' },
        { name: 'cmd2', description: 'Command 2' },
      ],
      plugins: [
        {
          name: 'plugin1',
          description: 'Plugin 1',
          commands: [{ name: 'plugin-cmd', description: 'Plugin command' }],
        },
      ],
    }

    const help = Effect.runSync(generateAppHelp(doc))

    expect(help).toContain('test-app v1.0.0')
    expect(help).toContain('A test application')
    expect(help).toContain('AVAILABLE COMMANDS:')
    expect(help).toContain('cmd1')
    expect(help).toContain('Command 1')
    expect(help).toContain('cmd2')
    expect(help).toContain('Command 2')
    expect(help).toContain('PLUGINS:')
    expect(help).toContain('plugin1')
    expect(help).toContain('(1 commands)')
  })
})

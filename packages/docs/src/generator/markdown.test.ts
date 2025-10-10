/**
 * @tuix/docs - Markdown generation tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { generateCommandMarkdown, generatePluginMarkdown, generateAppMarkdown } from './markdown'
import type { CommandDoc, PluginDoc, AppDoc } from '../types'

describe('@tuix/docs - Markdown Generation', () => {
  test('generates markdown for simple command', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      description: 'A test command',
    }

    const markdown = Effect.runSync(generateCommandMarkdown(doc))

    expect(markdown).toContain('## test-cmd')
    expect(markdown).toContain('A test command')
  })

  test('generates markdown for command with usage', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      description: 'A test command',
      usage: ['test-cmd <file>', 'test-cmd --help'],
    }

    const markdown = Effect.runSync(generateCommandMarkdown(doc))

    expect(markdown).toContain('### Usage')
    expect(markdown).toContain('test-cmd <file>')
    expect(markdown).toContain('test-cmd --help')
  })

  test('generates markdown for command with arguments', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      args: [
        { name: 'file', description: 'Input file', required: true },
        { name: 'output', description: 'Output file', required: false, default: 'out.txt' },
      ],
    }

    const markdown = Effect.runSync(generateCommandMarkdown(doc))

    expect(markdown).toContain('### Arguments')
    expect(markdown).toContain('**file**')
    expect(markdown).toContain('(required)')
    expect(markdown).toContain('Input file')
    expect(markdown).toContain('**output**')
    expect(markdown).toContain('(optional)')
    expect(markdown).toContain('Default: `out.txt`')
  })

  test('generates markdown for command with options', () => {
    const doc: CommandDoc = {
      name: 'test-cmd',
      options: [
        { short: '-v', long: '--verbose', description: 'Verbose output' },
        { long: '--output', description: 'Output file', default: 'out.txt' },
      ],
    }

    const markdown = Effect.runSync(generateCommandMarkdown(doc))

    expect(markdown).toContain('### Options')
    expect(markdown).toContain('**-v, --verbose**')
    expect(markdown).toContain('Verbose output')
    expect(markdown).toContain('**--output**')
    expect(markdown).toContain('Default: `out.txt`')
  })

  test('generates markdown for plugin', () => {
    const doc: PluginDoc = {
      name: 'test-plugin',
      description: 'A test plugin',
      commands: [
        { name: 'cmd1', description: 'Command 1' },
        { name: 'cmd2', description: 'Command 2' },
      ],
    }

    const markdown = Effect.runSync(generatePluginMarkdown(doc))

    expect(markdown).toContain('# test-plugin')
    expect(markdown).toContain('A test plugin')
    expect(markdown).toContain('## Commands')
    expect(markdown).toContain('## cmd1')
    expect(markdown).toContain('## cmd2')
  })

  test('generates markdown for app', () => {
    const doc: AppDoc = {
      name: 'test-app',
      version: '1.0.0',
      description: 'A test application',
      commands: [
        { name: 'global-cmd', description: 'Global command' },
      ],
      plugins: [
        {
          name: 'plugin1',
          description: 'Plugin 1',
          commands: [
            { name: 'plugin-cmd', description: 'Plugin command' },
          ],
        },
      ],
    }

    const markdown = Effect.runSync(generateAppMarkdown(doc))

    expect(markdown).toContain('# test-app')
    expect(markdown).toContain('Version: 1.0.0')
    expect(markdown).toContain('A test application')
    expect(markdown).toContain('## Table of Contents')
    expect(markdown).toContain('### Plugins')
    expect(markdown).toContain('### Commands')
    expect(markdown).toContain('# plugin1')
    expect(markdown).toContain('# Commands')
    expect(markdown).toContain('## global-cmd')
  })
})

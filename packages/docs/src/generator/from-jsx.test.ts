/**
 * @tuix/docs - JSX extraction tests
 */

import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { extractCommandDoc, extractPluginDoc, extractAppDoc } from './from-jsx'
import type { CommandDoc, PluginDoc } from '../types'

describe('@tuix/docs - JSX Extraction', () => {
  test('extracts command documentation from component', () => {
    const component = {
      type: { name: 'Command' },
      props: {
        name: 'test-cmd',
        description: 'A test command',
        usage: ['test-cmd [options]'],
        args: [
          { name: 'input', description: 'Input file', required: true },
        ],
        options: [
          { short: '-v', long: '--verbose', description: 'Verbose output' },
        ],
      },
    }

    const doc = Effect.runSync(extractCommandDoc(component))

    expect(doc.name).toBe('test-cmd')
    expect(doc.description).toBe('A test command')
    expect(doc.usage).toEqual(['test-cmd [options]'])
    expect(doc.args).toHaveLength(1)
    expect(doc.args?.[0].name).toBe('input')
    expect(doc.options).toHaveLength(1)
    expect(doc.options?.[0].long).toBe('--verbose')
  })

  test('extracts plugin documentation with commands', () => {
    const component = {
      type: { name: 'Plugin' },
      props: {
        name: 'test-plugin',
        description: 'A test plugin',
        children: [
          {
            type: { name: 'Command' },
            props: {
              name: 'cmd1',
              description: 'Command 1',
            },
          },
          {
            type: { name: 'Command' },
            props: {
              name: 'cmd2',
              description: 'Command 2',
            },
          },
        ],
      },
    }

    const doc = Effect.runSync(extractPluginDoc(component))

    expect(doc.name).toBe('test-plugin')
    expect(doc.description).toBe('A test plugin')
    expect(doc.commands).toHaveLength(2)
    expect(doc.commands[0].name).toBe('cmd1')
    expect(doc.commands[1].name).toBe('cmd2')
  })

  test('extracts app documentation from tree', () => {
    const rootComponent = {
      type: { name: 'App' },
      props: {
        children: [
          {
            type: { name: 'Command' },
            props: {
              name: 'global-cmd',
              description: 'Global command',
            },
          },
          {
            type: { name: 'TestPlugin' },
            props: {
              name: 'test-plugin',
              children: [
                {
                  type: { name: 'Command' },
                  props: {
                    name: 'plugin-cmd',
                    description: 'Plugin command',
                  },
                },
              ],
            },
          },
        ],
      },
    }

    const doc = Effect.runSync(extractAppDoc(rootComponent, 'test-app', '1.0.0'))

    expect(doc.name).toBe('test-app')
    expect(doc.version).toBe('1.0.0')
    expect(doc.commands).toHaveLength(1)
    expect(doc.commands[0].name).toBe('global-cmd')
    expect(doc.plugins).toHaveLength(1)
    expect(doc.plugins[0].name).toBe('test-plugin')
    expect(doc.plugins[0].commands).toHaveLength(1)
  })

  test('handles missing props gracefully', () => {
    const component = {
      type: { name: 'Command' },
      props: {},
    }

    const doc = Effect.runSync(extractCommandDoc(component))

    expect(doc.name).toBe('unknown')
    expect(doc.description).toBeUndefined()
    expect(doc.usage).toBeUndefined()
  })

  test('handles array usage prop', () => {
    const component = {
      type: { name: 'Command' },
      props: {
        name: 'test',
        usage: ['usage 1', 'usage 2'],
      },
    }

    const doc = Effect.runSync(extractCommandDoc(component))

    expect(doc.usage).toEqual(['usage 1', 'usage 2'])
  })

  test('handles string usage prop', () => {
    const component = {
      type: { name: 'Command' },
      props: {
        name: 'test',
        usage: 'single usage',
      },
    }

    const doc = Effect.runSync(extractCommandDoc(component))

    expect(doc.usage).toEqual(['single usage'])
  })
})

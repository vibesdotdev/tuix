import { test, expect, describe } from 'bun:test'
import { Effect } from 'effect'
import { extractAppDoc, extractAppDocFromScopes } from './from-jsx'

describe('extractAppDoc', () => {
  test('evaluates root function and finds Command descriptors', () => {
    // Simulate TuixApp shape without importing bin (avoids circular load)
    function Command(_props: Record<string, unknown>) {
      return null
    }
    Object.defineProperty(Command, 'name', { value: 'Command' })

    function App() {
      return {
        type: 'fragment',
        props: {
          children: [
            { type: Command, props: { name: 'version', description: 'Show version' } },
            { type: Command, props: { name: 'help', description: 'Help explorer' } },
            { type: Command, props: { name: 'dashboard', description: 'Dashboard' } },
          ],
        },
      }
    }

    const docs = Effect.runSync(extractAppDoc(App, 'tuix', '1.0.0-rc.3'))
    expect(docs.name).toBe('tuix')
    expect(docs.commands.map(c => c.name).sort()).toEqual(['dashboard', 'help', 'version'])
    expect(docs.commands.find(c => c.name === 'help')?.description).toContain('Help')
  })

  test('accepts already-evaluated tree', () => {
    function Command() {
      return null
    }
    Object.defineProperty(Command, 'name', { value: 'Command' })
    const tree = {
      type: Command,
      props: { name: 'only', description: 'one' },
    }
    const docs = Effect.runSync(extractAppDoc(tree, 'x'))
    expect(docs.commands).toEqual([{ name: 'only', description: 'one' }])
  })
})

describe('extractAppDocFromScopes', () => {
  test('maps executable root scopes to commands', () => {
    const docs = extractAppDocFromScopes(
      [
        { name: 'version', description: 'v', executable: true, path: ['version'] },
        { name: 'help', description: 'h', executable: true, path: ['help'] },
        { name: 'hidden', executable: true, path: ['hidden'], metadata: { hidden: true } },
        { name: 'nested', executable: true, path: ['a', 'b'] },
      ],
      'tuix',
      '1.0.0'
    )
    expect(docs.commands.map(c => c.name)).toEqual(['version', 'help'])
  })
})

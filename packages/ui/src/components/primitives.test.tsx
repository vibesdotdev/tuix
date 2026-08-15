/** @jsxImportSource @tuix/jsx */

import { describe, expect, test } from 'bun:test'
import { Effect } from 'effect'
import { $state, toView } from '@tuix/jsx'
import {
  Button,
  Card,
  CommandPalette,
  Editor,
  FileTree,
  Input,
  Modal,
  Select,
  Textarea,
} from '@tuix/ui'

async function paint(node: unknown): Promise<string> {
  const view = toView(node)
  const out = await Effect.runPromise(view.render())
  return typeof out === 'string' ? out : out.content
}

describe('Tuix kit primitives', () => {
  test('Button paints primary and danger labels', async () => {
    const primary = await paint(<Button variant="primary">Save</Button>)
    const danger = await paint(<Button variant="danger">Delete</Button>)
    expect(primary).toContain('Save')
    expect(primary).toContain('[')
    expect(danger).toContain('Delete')
    expect(danger).toContain('!')
    expect(primary).not.toContain('[object Object]')
  })

  test('Input paints value and placeholder', async () => {
    const filled = await paint(<Input value="Ada" />)
    const empty = await paint(<Input placeholder="Name" />)
    expect(filled).toContain('Ada')
    expect(empty).toContain('Name')
  })

  test('Input bind:value unwraps a rune', async () => {
    const name = $state('Ada')
    const content = await paint(<Input bind:value={name} placeholder="Name" />)
    expect(content).toContain('Ada')
    expect(content).not.toContain('function')
  })

  test('Textarea paints multiple lines', async () => {
    const content = await paint(<Textarea value={'one\ntwo'} rows={2} />)
    expect(content).toContain('one')
    expect(content).toContain('two')
  })

  test('Select paints the selected option', async () => {
    const content = await paint(
      <Select
        value="ts"
        options={[
          { value: 'ts', label: 'TypeScript' },
          { value: 'js', label: 'JavaScript' },
        ]}
      />
    )
    expect(content).toContain('TypeScript')
  })

  test('Modal is silent when closed and titled when open', async () => {
    const closed = await paint(
      <Modal open={false} title="Confirm">
        body
      </Modal>
    )
    const opened = await paint(
      <Modal open title="Confirm">
        Discard draft?
      </Modal>
    )
    expect(closed).not.toContain('Confirm')
    expect(opened).toContain('Confirm')
    expect(opened).toContain('Discard draft?')
  })

  test('Card paints title and compound slots', async () => {
    const titled = await paint(<Card title="Workers">3 running</Card>)
    const compound = await paint(
      <Card>
        <Card.Header>
          <Card.Title>Sessions</Card.Title>
        </Card.Header>
        <Card.Content>idle</Card.Content>
      </Card>
    )
    expect(titled).toContain('Workers')
    expect(titled).toContain('3 running')
    expect(compound).toContain('Sessions')
    expect(compound).toContain('idle')
  })

  test('Editor numbers source lines', async () => {
    const content = await paint(<Editor language="ts" value={'const a = 1\nconst b = 2'} />)
    expect(content).toContain('ts')
    expect(content).toContain('1 │ const a = 1')
    expect(content).toContain('2 │ const b = 2')
  })

  test('FileTree paints guides and selection', async () => {
    const content = await paint(
      <FileTree
        selected="src/a.ts"
        nodes={[
          {
            id: 'src',
            name: 'src',
            children: [
              { id: 'src/a.ts', name: 'a.ts' },
              { id: 'src/b.ts', name: 'b.ts' },
            ],
          },
        ]}
      />
    )
    expect(content).toContain('src')
    expect(content).toContain('a.ts')
    expect(content).toContain('b.ts')
    expect(content).toContain('>')
    expect(content).toContain('├──')
    expect(content).toContain('└──')
  })

  test('CommandPalette filters and hides when closed', async () => {
    const items = [
      { id: 'save', label: 'Save file', hint: '⌘S' },
      { id: 'quit', label: 'Quit' },
    ]
    const closed = await paint(
      <CommandPalette
        open={false}
        items={items}
        onPick={() => undefined}
        onClose={() => undefined}
      />
    )
    const opened = await paint(
      <CommandPalette
        open
        query="save"
        items={items}
        selected="save"
        onPick={() => undefined}
        onClose={() => undefined}
      />
    )
    expect(closed).not.toContain('Save file')
    expect(opened).toContain('Command')
    expect(opened).toContain('Save file')
    expect(opened).toContain('⌘S')
    expect(opened).not.toContain('Quit')
  })
})

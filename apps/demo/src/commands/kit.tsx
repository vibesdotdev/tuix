/** @jsxImportSource @tuix/jsx */

import { colors, style } from '@tuix/ansi'
import {
  Button,
  ButtonGroup,
  Card,
  CommandPalette,
  Editor,
  FileTree,
  Input,
  Mark,
  Select,
  StatusBar,
  Textarea,
} from '@tuix/ui'

export default function Kit() {
  return (
    <vstack>
      <hstack gap={3}>
        <Mark frame={0.35} cols={17} rows={9} />
        <vstack>
          <text style={style().fg(colors.white).bold()}>Tuix kit</text>
          <text style={style().fg(colors.gray)}>primitives for a real TUI</text>
        </vstack>
        <Mark frame={1} cols={17} rows={9} />
      </hstack>
      <text></text>
      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="ghost">Skip</Button>
      </ButtonGroup>
      <text></text>
      <hstack gap={4}>
        <vstack>
          <text style={style().fg(colors.cyan).bold()}>Identity</text>
          <Input value="Ada Lovelace" placeholder="Name" focused />
          <Select
            value="ts"
            options={[
              { value: 'ts', label: 'TypeScript' },
              { value: 'js', label: 'JavaScript' },
            ]}
          />
          <Textarea value={'Short note\nSecond line'} rows={2} />
        </vstack>
        <vstack>
          <text style={style().fg(colors.cyan).bold()}>Workspace</text>
          <FileTree
            selected="src/app.tsx"
            nodes={[
              {
                id: 'src',
                name: 'src',
                children: [
                  { id: 'src/app.tsx', name: 'app.tsx' },
                  { id: 'src/kit.tsx', name: 'kit.tsx' },
                ],
              },
            ]}
          />
        </vstack>
        <vstack>
          <text style={style().fg(colors.cyan).bold()}>Source</text>
          <Editor language="ts" value={'export const ok = true'} />
          <Card title="Workers">3 running</Card>
        </vstack>
        <vstack>
          <text style={style().fg(colors.yellow).bold()}>Overlays</text>
          <CommandPalette
            open
            query="sa"
            items={[
              { id: 'save', label: 'Save file', hint: '⌘S' },
              { id: 'quit', label: 'Quit' },
            ]}
            selected="save"
            onPick={() => undefined}
            onClose={() => undefined}
          />
        </vstack>
      </hstack>
      <text></text>
      <StatusBar
        facts={[{ slot: 'context', value: 'operator workbench' }]}
        hints={[
          { keys: '?', label: 'help' },
          { keys: '/', label: 'commands' },
        ]}
      />
    </vstack>
  )
}

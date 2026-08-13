/** @jsxImportSource @tuix/jsx */

import {
  Button,
  ButtonGroup,
  Card,
  CommandPalette,
  Editor,
  FileTree,
  Input,
  Modal,
  Select,
  Textarea,
} from '@tuix/ui'

export default function Kit() {
  return (
    <vstack>
      <text>Tuix kit</text>
      <text></text>
      <ButtonGroup>
        <Button variant="primary">Save</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="ghost">Skip</Button>
      </ButtonGroup>
      <Input value="Ada Lovelace" placeholder="Name" />
      <Textarea value={'Short note\nSecond line'} rows={2} />
      <Select
        value="ts"
        options={[
          { value: 'ts', label: 'TypeScript' },
          { value: 'js', label: 'JavaScript' },
        ]}
      />
      <Card title="Workers">3 running</Card>
      <Editor language="ts" value={'export const ok = true'} />
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
      <Modal open title="Confirm">
        Discard draft?
      </Modal>
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
  )
}

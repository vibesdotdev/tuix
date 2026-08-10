/**
 * MVU/JSX Help widget — list of commands with selection.
 */

import { $state } from '@tuix/reactive'
import { Box } from '../../layout/box/Box'
import { Text as T } from '../../display/text/Text'

export interface HelpEntry {
  name: string
  description?: string
}

export interface HelpProps {
  title?: string
  entries: HelpEntry[]
  selectedIndex?: number
  onSelect?: (entry: HelpEntry, index: number) => void
}

export function Help(props: HelpProps): JSX.Element {
  const idx = $state(props.selectedIndex ?? 0, 'helpSelectedIndex')
  const entries = props.entries ?? []
  const selected = idx()

  return (
    <Box direction="vertical">
      <T bold color="cyan">
        {props.title ?? 'Help'}
      </T>
      {entries.length === 0 ? (
        <T color="gray">No entries</T>
      ) : (
        entries.map((e, i) => (
          <T key={e.name} color={i === selected ? 'white' : 'gray'}>
            {i === selected ? '> ' : '  '}
            {e.name.padEnd(16)} {e.description ?? ''}
          </T>
        ))
      )}
    </Box>
  )
}

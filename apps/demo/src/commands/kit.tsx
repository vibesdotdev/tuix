/** @jsxImportSource @tuix/jsx */

/**
 * Kit — workbench that shows the primitives composing: session sidebar,
 * conversation thread, file list, composer bar, status bar.
 *
 * Keys: [tab] cycle focus · [j/k] navigate · [enter] send · [/] command · [?] help
 */

import { $state, registerKeyHandler, useViewport } from '@tuix/reactive'
import { CommandPalette, KbdHint, Modal, StatusBar, useUITheme } from '@tuix/ui'

type Focus = 'sessions' | 'files' | 'composer'
type Overlay = 'none' | 'command' | 'help'

interface Session {
  id: string
  title: string
}

interface Turn {
  role: 'you' | 'grok'
  text: string
}

const SESSIONS: Session[] = [
  { id: 'auth', title: 'rewrite auth' },
  { id: 'flower', title: 'kit flower' },
  { id: 'cutover', title: 'cutover receipts' },
]

const THREADS: Record<string, Turn[]> = {
  auth: [
    { role: 'you', text: 'Login still forks session state on refresh.' },
    { role: 'grok', text: 'Hold the cookie write until set-cookie returns.' },
    { role: 'you', text: 'Show me the owner.' },
    { role: 'grok', text: 'sessions-open.ts owns the open path.' },
  ],
  flower: [
    { role: 'you', text: 'The hero has to fill the terminal.' },
    { role: 'grok', text: 'Flex was eating CSI. Visual cells fixed it.' },
  ],
  cutover: [
    { role: 'you', text: 'Which receipts are still red?' },
    { role: 'grok', text: 'Leak-probe argv and the Studio live mount.' },
  ],
}

const FILES = ['sessions-open.ts', 'login.ts', 'store.ts', 'SPEC.md']

const COMMANDS = [
  { id: 'new', label: 'New session', hint: 'n' },
  { id: 'files', label: 'Focus files', hint: 'tab' },
  { id: 'help', label: 'Help', hint: '?' },
]

const FOCUSES: Focus[] = ['sessions', 'files', 'composer']

let keyCleanup: (() => void) | null = null

function wrap(text: string, width: number): string[] {
  const max = Math.max(16, width)
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max) {
      if (line) lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function trunc(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, width - 1)}…` : text
}

function Kit() {
  const { theme } = useUITheme()
  const focus = $state<Focus>('composer', 'focus')
  const overlay = $state<Overlay>('none', 'overlay')
  const selected = $state(0, 'selected')
  const fileIx = $state(0, 'fileIx')
  const draft = $state('', 'draft')
  const extra = $state<Turn[]>([], 'extra')
  const query = $state('', 'query')

  const vp = useViewport()
  const cols = vp().cols
  const sidebarW = 22
  const convoW = Math.max(20, cols - sidebarW - 3)

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    if (overlay() !== 'none') {
      if (key === 'Escape' || key === 'escape' || key === 'esc') {
        overlay.$set('none')
        query.$set('')
      }
      if (key === 'Enter' || key === 'enter') overlay.$set('none')
      return
    }
    if (key === 'Tab' || key === 'tab') {
      focus.$set(FOCUSES[(FOCUSES.indexOf(focus()) + 1) % FOCUSES.length]!)
      return
    }
    if (key === '/') {
      overlay.$set('command')
      return
    }
    if (key === '?') {
      overlay.$set('help')
      return
    }
    if (key === 'Escape' || key === 'escape' || key === 'esc') {
      focus.$set('sessions')
      return
    }
    if (focus() === 'sessions') {
      if (key === 'j' || key === 'down') {
        selected.$set(Math.min(SESSIONS.length - 1, selected() + 1))
        extra.$set([])
      } else if (key === 'k' || key === 'up') {
        selected.$set(Math.max(0, selected() - 1))
        extra.$set([])
      }
      return
    }
    if (focus() === 'files') {
      if (key === 'j' || key === 'down') fileIx.$set(Math.min(FILES.length - 1, fileIx() + 1))
      else if (key === 'k' || key === 'up') fileIx.$set(Math.max(0, fileIx() - 1))
      return
    }
    if (focus() === 'composer') {
      if (key === 'Enter' || key === 'enter') {
        const text = draft().trim()
        if (!text) return
        extra.$set([...extra(), { role: 'you', text }])
        draft.$set('')
      } else if (key === 'Backspace' || key === 'backspace') {
        draft.$set(draft().slice(0, -1))
      } else if (key.length === 1 && key >= ' ') {
        draft.$set(`${draft()}${key}`)
      }
    }
  })

  const session = SESSIONS[selected()] ?? SESSIONS[0]!
  const thread = [...(THREADS[session.id] ?? []), ...extra()]
  const dim = theme.colors.textDim
  const fg = theme.colors.fg
  const hi = theme.colors.primary
  const bright = theme.colors.textBright ?? fg

  const threadLines = thread.flatMap(turn => {
    const prefix = turn.role === 'you' ? 'you  ' : 'grok '
    return wrap(turn.text, Math.max(16, convoW - prefix.length - 1)).map((line, i) =>
      i === 0 ? `${prefix}${line}` : `     ${line}`
    )
  })
  const visible = threadLines.slice(-14)

  const sessionItems = SESSIONS.map((item, i) => {
    const isSel = i === selected()
    const isFocus = focus() === 'sessions'
    return (
      <text key={item.id} fg={isSel && isFocus ? hi : isSel ? bright : fg} bold={isSel}>
        {`${isSel ? '▸ ' : '  '}${trunc(item.title, sidebarW - 2)}`}
      </text>
    )
  })

  const fileItems = FILES.map((name, i) => {
    const at = i === fileIx() && focus() === 'files'
    return (
      <text key={name} fg={at ? hi : dim}>
        {`${at ? '▸ ' : '  '}${trunc(name, sidebarW - 2)}`}
      </text>
    )
  })

  const convo = visible.map((line, i) => (
    <text key={`l${i}`} fg={line.startsWith('you') ? dim : bright}>
      {`│ ${line}`}
    </text>
  ))

  const commandOverlay =
    overlay() === 'command' ? (
      <CommandPalette
        open
        items={COMMANDS}
        query={query()}
        onPick={item => {
          if (item.id === 'files') focus.$set('files')
          if (item.id === 'help') overlay.$set('help')
          else overlay.$set('none')
          query.$set('')
        }}
        onClose={() => overlay.$set('none')}
      />
    ) : null
  const helpOverlay =
    overlay() === 'help' ? (
      <Modal open title="Keys" width={Math.min(cols, 76)} onClose={() => overlay.$set('none')}>
        <vstack gap={0}>
          <KbdHint keys="tab" label="cycle focus" />
          <KbdHint keys="j/k" label="list nav" />
          <KbdHint keys="enter" label="send turn" />
          <KbdHint keys="/" label="command palette" />
          <KbdHint keys="?" label="this help" />
          <KbdHint keys="esc" label="close overlay" />
        </vstack>
      </Modal>
    ) : null

  return (
    <vstack gap={0} width="fill" height="fill">
      {/* Header */}
      <hstack gap={1}>
        <text bg="#0d3d2d" fg="#5eead4">
          {' ◈ vibes '}
        </text>
        <text fg={bright} bold>
          {session.title}
        </text>
        <text fg={dim}>{`${SESSIONS.length} sessions`}</text>
      </hstack>
      <text> </text>

      {/* Body: sidebar + conversation */}
      <hstack gap={1} width="fill">
        {/* Sidebar */}
        <vstack gap={0} width={sidebarW}>
          <text fg={dim} bold>
            {'sessions'}
          </text>
          {sessionItems}
          <text> </text>
          <text fg={dim} bold>
            {'files'}
          </text>
          {fileItems}
        </vstack>
        {/* Conversation — separator prefix on each line */}
        <vstack gap={0} flex={1}>
          <text fg={dim} bold>{`│ ${session.title}`}</text>
          <text> </text>
          {convo}
        </vstack>
      </hstack>
      <text> </text>

      {/* Composer */}
      <text fg={focus() === 'composer' ? hi : dim}>{`▸ ${draft() || 'say something…'}`}</text>
      <text> </text>

      {/* Status bar */}
      <StatusBar
        width="fill"
        facts={[
          { slot: 'context', value: session.title, tone: 'default' },
          { slot: 'file', value: FILES[fileIx()] ?? '', tone: 'muted' },
          { slot: 'focus', value: focus(), tone: 'muted' },
        ]}
        hints={[
          { keys: 'tab', label: 'focus' },
          { keys: '/', label: 'command' },
          { keys: 'esc', label: 'cancel' },
          { keys: 'enter', label: 'send' },
          { keys: '?', label: 'help' },
        ]}
      />
      {commandOverlay}
      {helpOverlay}
    </vstack>
  )
}

Kit.interactive = true

export default Kit

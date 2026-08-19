/** @jsxImportSource @tuix/jsx */

import { $state, registerKeyHandler, useViewport } from '@tuix/reactive'
import { Avatar, CommandPalette, KbdHint, Modal, StatusBar, useUITheme } from '@tuix/ui'

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
    { role: 'grok', text: 'session/src/tui/sessions-open owns the open path.' },
  ],
  flower: [
    { role: 'you', text: 'The hero has to fill the terminal.' },
    { role: 'grok', text: 'Flex was eating CSI. Visual cells plus a PTY-sized raster.' },
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
  const compact = cols < 90
  const wrapWidth = compact ? Math.max(16, cols - 30) : 60

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    const k = key
    if (overlay() === 'command') {
      if (k === 'Escape' || k === 'escape' || k === 'esc') {
        overlay.$set('none')
        query.$set('')
        return
      }
      if (k === 'Enter' || k === 'enter') {
        overlay.$set('none')
        return
      }
      if (k === 'Backspace' || k === 'backspace') {
        query.$set(query().slice(0, -1))
        return
      }
      if (k === 'space' || k === 'Space') query.$set(`${query()} `)
      else if (k === 'space' || k === 'Space') query.$set(`${query()} `)
      else if (k.length === 1 && k >= ' ') query.$set(`${query()}${k}`)
      return
    }
    if (overlay() === 'help') {
      if (k === 'Escape' || k === 'escape' || k === 'esc' || k === '?') overlay.$set('none')
      return
    }
    if (k === 'Tab' || k === 'tab') {
      focus.$set(FOCUSES[(FOCUSES.indexOf(focus()) + 1) % FOCUSES.length]!)
      return
    }
    if (k === '/') {
      overlay.$set('command')
      return
    }
    if (k === '?') {
      overlay.$set('help')
      return
    }
    if (k === 'Escape' || k === 'escape' || k === 'esc') {
      focus.$set('sessions')
      return
    }
    if (focus() === 'sessions') {
      if (k === 'j' || k === 'ArrowDown' || k === 'down') {
        selected.$set(Math.min(SESSIONS.length - 1, selected() + 1))
        extra.$set([])
        return
      }
      if (k === 'k' || k === 'ArrowUp' || k === 'up') {
        selected.$set(Math.max(0, selected() - 1))
        extra.$set([])
      }
      return
    }
    if (focus() === 'files') {
      if (k === 'j' || k === 'ArrowDown' || k === 'down') {
        fileIx.$set(Math.min(FILES.length - 1, fileIx() + 1))
        return
      }
      if (k === 'k' || k === 'ArrowUp' || k === 'up') fileIx.$set(Math.max(0, fileIx() - 1))
      return
    }
    if (focus() === 'composer') {
      if (k === 'Enter' || k === 'enter') {
        const text = draft().trim()
        if (!text) return
        extra.$set([...extra(), { role: 'you', text }])
        draft.$set('')
        return
      }
      if (k === 'Backspace' || k === 'backspace') {
        draft.$set(draft().slice(0, -1))
        return
      }
      if (k === 'space' || k === 'Space') draft.$set(`${draft()} `)
      else if (k === 'space' || k === 'Space') draft.$set(`${draft()} `)
      else if (k.length === 1 && k >= ' ') draft.$set(`${draft()}${k}`)
    }
  })

  const session = SESSIONS[selected()] ?? SESSIONS[0]!
  const thread = [...(THREADS[session.id] ?? []), ...extra()]
  const threadBudget = compact ? 6 : 14
  const threadLines = thread.flatMap(turn => {
    const prefix = turn.role === 'you' ? 'you  ' : 'grok '
    return wrap(turn.text, Math.max(16, wrapWidth - prefix.length - 1)).map((line, i) =>
      i === 0 ? `${prefix}${line}` : `     ${line}`
    )
  })
  const visible = threadLines.slice(-threadBudget)
  const dim = theme.colors.textDim
  const fg = theme.colors.fg
  const hi = theme.colors.primary

  const sessionLines = SESSIONS.map((item, i) => (
    <hstack key={item.id} gap={1}>
      <text fg={i === selected() && focus() === 'sessions' ? hi : dim}>
        {i === selected() ? '▸' : ' '}
      </text>
      <Avatar glyph={item.id === 'auth' ? '⚡' : item.id === 'flower' ? '✿' : '📦'} size="small" />
      <text fg={i === selected() && focus() === 'sessions' ? hi : fg}>{item.title}</text>
    </hstack>
  ))
  const fileLines = FILES.map((name, i) => (
    <text key={name} fg={i === fileIx() && focus() === 'files' ? hi : fg}>
      {`${i === fileIx() ? '▸ ' : '  '}${name}`}
    </text>
  ))
  const convo = visible.map((line, i) => (
    <text key={`${i}`} fg={line.startsWith('you') ? dim : fg}>
      {line}
    </text>
  ))

  const body = compact ? (
    <flex direction="column" width="fill" flex={1}>
      <text fg={dim}>sessions</text>
      {sessionLines}
      <text> </text>
      <flex direction="column" width="fill" flex={1}>
        {convo}
      </flex>
    </flex>
  ) : (
    <flex direction="row" width="fill" flex={1}>
      <flex direction="column" width="28%">
        <text fg={dim}>sessions</text>
        {sessionLines}
        <text> </text>
        <text fg={dim}>files</text>
        {fileLines}
      </flex>
      <flex direction="column" width="fill" flex={1}>
        <text fg={dim}>{session.title}</text>
        {convo}
      </flex>
    </flex>
  )

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
    <flex direction="column" width="fill" height="fill">
      <hstack gap={1}>
        <text bg="#0d3d2d" fg="#5eead4">
          {' ◈ vibes '}
        </text>
        <text fg={theme.colors.textBright}>{session.title}</text>
        <text fg={dim}>{`${SESSIONS.length} sessions`}</text>
      </hstack>
      {body}
      {commandOverlay}
      {helpOverlay}
      <text fg={focus() === 'composer' ? hi : dim}>{`▸ ${draft() || 'say something…'}`}</text>
      <StatusBar
        width="fill"
        facts={
          compact
            ? [
                { slot: 'context', value: session.title, tone: 'default' },
                { slot: 'focus', value: focus(), tone: 'muted' },
              ]
            : [
                { slot: 'context', value: session.title, tone: 'default' },
                { slot: 'file', value: FILES[fileIx()] ?? '', tone: 'muted' },
                { slot: 'focus', value: focus(), tone: 'muted' },
              ]
        }
        hints={
          compact
            ? [
                { keys: 'tab', label: 'focus' },
                { keys: '/', label: 'cmd' },
                { keys: 'esc', label: 'back' },
              ]
            : [
                { keys: 'tab', label: 'focus' },
                { keys: '/', label: 'command' },
                { keys: 'esc', label: 'cancel' },
                { keys: 'enter', label: 'send' },
                { keys: '?', label: 'help' },
              ]
        }
      />
    </flex>
  )
}

Kit.interactive = true

export default Kit

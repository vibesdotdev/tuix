/** @jsxImportSource @tuix/jsx */

import { $state, registerKeyHandler } from '@tuix/reactive'
import { CommandPalette, Modal, StatusBar, useUITheme } from '@tuix/ui'

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

function viewport() {
  return {
    cols: Math.max(60, process.stdout.columns ?? 80),
    rows: Math.max(18, process.stdout.rows ?? 24),
  }
}

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

  const { cols, rows } = viewport()
  const compact = cols < 90
  const chrome = 3
  const bodyH = Math.max(4, rows - chrome)
  const sideW = compact ? cols : Math.min(24, Math.max(18, Math.floor(cols * 0.28)))
  const mainW = compact ? cols : Math.max(20, cols - sideW)

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
      if (k.length === 1 && k >= ' ') query.$set(`${query()}${k}`)
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
      if (k.length === 1 && k >= ' ') draft.$set(`${draft()}${k}`)
    }
  })

  const session = SESSIONS[selected()] ?? SESSIONS[0]!
  const thread = [...(THREADS[session.id] ?? []), ...extra()]
  const threadBudget = Math.max(3, bodyH - (compact ? 6 : 2))
  const threadLines = thread.flatMap(turn => {
    const prefix = turn.role === 'you' ? 'you  ' : 'grok '
    return wrap(turn.text, Math.max(16, mainW - prefix.length - 1)).map((line, i) =>
      i === 0 ? `${prefix}${line}` : `     ${line}`
    )
  })
  const visible = threadLines.slice(-threadBudget)
  const dim = theme.colors.textDim
  const fg = theme.colors.fg
  const hi = theme.colors.primary

  const sessionLines = SESSIONS.map((item, i) => (
    <text key={item.id} fg={i === selected() && focus() === 'sessions' ? hi : fg}>
      {`${i === selected() ? '▸ ' : '  '}${item.title}`}
    </text>
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
    <flex direction="column" width={cols} height={bodyH}>
      <text fg={dim}>sessions</text>
      {sessionLines}
      <text> </text>
      {convo}
    </flex>
  ) : (
    <flex direction="row" width={cols} height={bodyH}>
      <flex direction="column" width={sideW} height={bodyH}>
        <text fg={dim}>sessions</text>
        {sessionLines}
        <text> </text>
        <text fg={dim}>files</text>
        {fileLines}
      </flex>
      <flex direction="column" width={mainW} height={bodyH}>
        <text fg={dim}>{session.title}</text>
        {convo}
      </flex>
    </flex>
  )

  const surface =
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
    ) : overlay() === 'help' ? (
      <Modal open title="Keys" onClose={() => overlay.$set('none')}>
        <text>tab cycles. j/k lists. type to compose. enter sends. / command. esc closes.</text>
      </Modal>
    ) : (
      body
    )

  return (
    <flex direction="column" width={cols} height={rows}>
      <text
        fg={theme.colors.textBright}
      >{`vibes   ${session.title}   ${SESSIONS.length} sessions`}</text>
      {surface}
      <text fg={focus() === 'composer' ? hi : dim}>{`▸ ${draft() || 'say something…'}`}</text>
      <StatusBar
        width={cols}
        facts={
          compact
            ? [
                { slot: 'context', value: session.title },
                { slot: 'focus', value: focus() },
              ]
            : [
                { slot: 'context', value: session.title },
                { slot: 'file', value: FILES[fileIx()] ?? '' },
                { slot: 'focus', value: focus() },
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

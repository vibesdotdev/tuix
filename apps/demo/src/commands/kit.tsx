/** @jsxImportSource @tuix/jsx */

import { $state, getMvuPush, registerKeyHandler } from '@tuix/reactive'
import { CommandPalette, Mark, Modal, StatusBar, useUITheme } from '@tuix/ui'

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
let bootTimer = false

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
  const boot = $state(
    process.argv.includes('kit') && Boolean(process.stdout.isTTY) && process.env.TUIX_BOOT !== '0',
    'boot'
  )
  const focus = $state<Focus>('composer', 'focus')
  const overlay = $state<Overlay>('none', 'overlay')
  const selected = $state(0, 'selected')
  const fileIx = $state(0, 'fileIx')
  const draft = $state('', 'draft')
  const extra = $state<Turn[]>([], 'extra')
  const query = $state('', 'query')

  const { cols, rows } = viewport()
  const compact = cols < 90
  const sidebar = compact ? 0 : Math.max(20, Math.min(26, Math.floor(cols * 0.26)))
  const mainW = compact ? cols : Math.max(28, cols - sidebar - 3)

  if (!bootTimer) {
    bootTimer = true
    const waitForBridge = () => {
      if (!getMvuPush()) {
        setTimeout(waitForBridge, 40)
        return
      }
      setTimeout(() => {
        if (boot()) boot.$set(false)
      }, 180)
    }
    waitForBridge()
  }

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    const k = key
    if (boot()) {
      boot.$set(false)
      return
    }
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
        return
      }
      if (k === 'Enter' || k === 'enter') focus.$set('composer')
      return
    }
    if (focus() === 'files') {
      if (k === 'j' || k === 'ArrowDown' || k === 'down') {
        fileIx.$set(Math.min(FILES.length - 1, fileIx() + 1))
        return
      }
      if (k === 'k' || k === 'ArrowUp' || k === 'up') {
        fileIx.$set(Math.max(0, fileIx() - 1))
      }
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

  if (boot()) {
    return (
      <flex direction="column">
        <Mark cols={cols} rows={Math.max(8, rows - 1)} scale={1} frame={2.2} />
        <StatusBar facts={[{ slot: 'context', value: 'vibes' }]} hints={[{ keys: 'any', label: 'continue' }]} />
      </flex>
    )
  }

  const session = SESSIONS[selected()] ?? SESSIONS[0]!
  const thread = [...(THREADS[session.id] ?? []), ...extra()]
  const threadBudget = Math.max(4, rows - (compact ? 10 : 6))
  const threadLines = thread.flatMap(turn => {
    const prefix = turn.role === 'you' ? 'you  ' : 'grok '
    return wrap(turn.text, mainW - prefix.length - 1).map((line, i) =>
      i === 0 ? `${prefix}${line}` : `     ${line}`
    )
  })
  const visible = threadLines.slice(-threadBudget)
  const dim = theme.colors.textDim
  const fg = theme.colors.fg
  const hi = theme.colors.primary

  const sessionLines = SESSIONS.map((item, i) => {
    const mark = i === selected() ? '▸ ' : '  '
    return (
      <text key={item.id} fg={i === selected() && focus() === 'sessions' ? hi : fg}>
        {`${mark}${item.title}`}
      </text>
    )
  })
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
  const composer = (
    <text fg={focus() === 'composer' ? hi : dim}>{`▸ ${draft() || 'say something…'}`}</text>
  )

  const body = compact ? (
    <vstack>
      <text fg={dim}>sessions</text>
      {sessionLines}
      <text> </text>
      {convo}
    </vstack>
  ) : (
    <hstack>
      <vstack>
        <text fg={dim}>sessions</text>
        {sessionLines}
        <text> </text>
        <text fg={dim}>files</text>
        {fileLines}
      </vstack>
      <vstack>
        <text fg={dim}>{session.title}</text>
        {convo}
      </vstack>
    </hstack>
  )

  return (
    <flex direction="column">
      <text fg={theme.colors.textBright}>{`vibes   ${session.title}   ${SESSIONS.length} sessions`}</text>
      {body}
      {composer}
      <StatusBar
        facts={[
          { slot: 'context', value: session.title },
          { slot: 'file', value: FILES[fileIx()] ?? '' },
          { slot: 'focus', value: focus() },
        ]}
        hints={[
          { keys: 'tab', label: 'focus' },
          { keys: '/', label: 'command' },
          { keys: 'esc', label: 'cancel' },
          { keys: 'enter', label: 'send' },
          { keys: '?', label: 'help' },
        ]}
      />
      <CommandPalette
        open={overlay() === 'command'}
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
      <Modal open={overlay() === 'help'} title="Keys" onClose={() => overlay.$set('none')}>
        <text>tab cycles. j/k lists. type to compose. enter sends. / command. esc closes.</text>
      </Modal>
    </flex>
  )
}

Kit.interactive = true

export default Kit

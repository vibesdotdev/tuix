/** @jsxImportSource @tuix/jsx */

/**
 * Tasks — task board with filters, focus-ring input, and a scrim confirm.
 *
 * Keys: [tab] focus input · [j/k] move · [space] toggle · [x] delete ·
 *       [1/2/3] filter · [esc] reset
 */

import { $state, $derived, registerKeyHandler, isFocused } from '@tuix/reactive'
import { Input, KbdHint, Modal, useUITheme } from '@tuix/ui'

type Filter = 'all' | 'active' | 'done'

interface Task {
  id: number
  title: string
  tag: string
  done: boolean
}

const SEED: Task[] = [
  { id: 1, title: 'Ship overlay scrim', tag: 'modal', done: true },
  { id: 2, title: 'Center command palette', tag: 'kit', done: true },
  { id: 3, title: 'Record demo videos', tag: 'docs', done: false },
  { id: 4, title: 'Fix footer key chips', tag: 'kit', done: false },
  { id: 5, title: 'Gallery page on the site', tag: 'www', done: false },
]

const LIST_W = 44

let nextId = 6
let keyCleanup: (() => void) | null = null

export default function Tasks() {
  const { theme } = useUITheme()
  const tasks = $state(SEED as Task[], 'tasks')
  const cursor = $state(0, 'cursor')
  const filter = $state<Filter>('all', 'filter')
  const draft = $state('', 'draft')
  const confirm = $state(-1, 'confirm')
  const notice = $state('', 'notice')

  const visible = $derived(() => {
    const all = tasks()
    const f = filter()
    return f === 'all' ? all : all.filter(t => (f === 'done') === t.done)
  })

  function say(text: string) {
    notice.$set(text)
    setTimeout(() => {
      if (notice() === text) notice.$set('')
    }, 1800)
  }

  function move(delta: number) {
    const n = visible().length
    if (n === 0) return
    cursor.$set((cursor() + delta + n) % n)
  }

  function add() {
    const title = draft().trim()
    if (!title) return
    tasks.$set([{ id: nextId++, title, tag: 'new', done: false }, ...tasks()])
    draft.$set('')
    cursor.$set(0)
    say('added ✓')
  }

  function toggleCurrent() {
    const t = visible()[cursor()]
    if (!t) return
    tasks.$set(tasks().map(x => (x.id === t.id ? { ...x, done: !x.done } : x)))
    say(t.done ? 'reopened' : 'done ✓')
  }

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    if (confirm() >= 0) return // modal owns keys via overlay capture
    if (isFocused('bind:draft')) return // focus ring owns typing
    if (key === 'j' || key === 'down') move(1)
    else if (key === 'k' || key === 'up') move(-1)
    else if (key === ' ' || key === 'space') toggleCurrent()
    else if (key === '1') filter.$set('all')
    else if (key === '2') filter.$set('active')
    else if (key === '3') filter.$set('done')
    else if (key === 'x' || key === 'X') {
      const t = visible()[cursor()]
      if (t) confirm.$set(t.id)
    } else if (key === 'escape' || key === 'Escape') {
      filter.$set('all')
      cursor.$set(0)
    }
  })

  const list = visible()
  const open = tasks().filter(t => !t.done).length
  const done = tasks().length - open
  const dim = theme.colors.textDim ?? '#7d8ca3'
  const bright = theme.colors.textBright ?? theme.colors.fg

  const FILTERS: Array<[Filter, string]> = [
    ['all', 'all'],
    ['active', 'active'],
    ['done', 'done'],
  ]

  return (
    <box padding={1}>
      <vstack gap={0}>
        {/* Header: title chip + stats */}
        <hstack gap={1}>
          <text bg={theme.colors.primary} fg={theme.colors.bg}>
            {' Tuix Tasks '}
          </text>
          <text fg={dim}>{`${open} open · ${done} done`}</text>
        </hstack>
        <text> </text>

        {/* Filter row on the list grid */}
        <hstack gap={1} width={LIST_W}>
          {FILTERS.map(([f, label]) => {
            const active = filter() === f
            return (
              <text key={f} fg={active ? theme.colors.primary : dim}>
                {active ? `[ ${label} ]` : ` ${label} `}
              </text>
            )
          })}
          <text fg={dim}>{`· ${list.length}`}</text>
        </hstack>
        <text> </text>

        {/* Task rows: cursor mark, state mark, title, tag on one grid */}
        {list.length === 0 ? (
          <text width={LIST_W} fg={dim}>
            nothing here — tab to the input and add one
          </text>
        ) : (
          list.map((t, i) => {
            const at = i === cursor()
            return (
              <hstack key={t.id} gap={1} width={LIST_W}>
                <text fg={at ? theme.colors.primary : dim}>{at ? '▸' : ' '}</text>
                <text fg={t.done ? theme.colors.success : dim}>{t.done ? '✓' : '·'}</text>
                <text fg={t.done ? dim : at ? bright : undefined}>{t.title}</text>
                <text fg={dim}>{`· ${t.tag}`}</text>
              </hstack>
            )
          })
        )}
        <text> </text>

        {/* New task: focus-ring input on the same grid */}
        <hstack gap={1}>
          <text fg={dim}>{'new'}</text>
          <Input
            bind:value={draft}
            placeholder="task title, enter to add"
            width={LIST_W - 5}
            onSubmit={add}
          />
        </hstack>

        {/* Status line + hints */}
        <text> </text>
        <text fg={notice() ? theme.colors.success : dim} width={LIST_W}>
          {notice() ? notice() : 'tab focuses the input'}
        </text>
        <text> </text>
        <hstack gap={2}>
          <KbdHint keys="tab" label="focus" />
          <KbdHint keys="j/k" label="move" />
          <KbdHint keys="space" label="toggle" />
          <KbdHint keys="x" label="delete" />
          <KbdHint keys="1/2/3" label="filter" />
        </hstack>

        <Modal
          open={confirm() >= 0}
          title="Delete task?"
          width={44}
          height={8}
          scrim
          closeOnBackdrop
          onClose={() => confirm.$set(-1)}
          onCancel={() => confirm.$set(-1)}
          cancelLabel="Keep"
          onConfirm={() => {
            tasks.$set(tasks().filter(t => t.id !== confirm()))
            confirm.$set(-1)
            say('deleted')
          }}
          confirmLabel="Delete"
        >
          <text>{visible()[Math.max(0, cursor())]?.title ?? ''}</text>
        </Modal>
      </vstack>
    </box>
  )
}

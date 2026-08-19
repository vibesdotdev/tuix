/** @jsxImportSource @tuix/jsx */

/**
 * Tasks — kanban-style task list with filters, inline add, and delete
 * confirmation.
 *
 * Keys: [tab] focus · [j/k] move · [space] toggle · [x] delete · [1/2/3] filter
 */

import { $state, registerKeyHandler } from '@tuix/reactive'
import { Input, Modal, KbdHint, useUITheme } from '@tuix/ui'

interface Task {
  id: string
  title: string
  done: boolean
  tag: string
}

type Filter = 'all' | 'active' | 'done'

let keyCleanup: (() => void) | null = null

const INITIAL: Task[] = [
  { id: '1', title: 'Ship overlay scrim modal', done: true, tag: 'kit' },
  { id: '2', title: 'Center command palette', done: true, tag: 'kit' },
  { id: '3', title: 'Record demo videos', done: false, tag: 'docs' },
  { id: '4', title: 'Fix footer key chips', done: false, tag: 'kit' },
  { id: '5', title: 'Gallery page on the site', done: false, tag: 'www' },
]

export default function Tasks() {
  const { theme } = useUITheme()
  const tasks = $state<Task[]>(INITIAL, 'tasks')
  const cursor = $state(0, 'cursor')
  const filter = $state<Filter>('all', 'filter')
  const draft = $state('', 'draft')
  const confirm = $state(-1, 'confirm')

  const dim = theme.colors.textDim ?? '#7d8ca3'
  const dim2 = theme.colors.textDim
  const bright = theme.colors.textBright ?? theme.colors.fg
  const fg = theme.colors.fg
  const accent = theme.colors.primary
  const ok = theme.colors.success
  const warn = theme.colors.warning

  const list = tasks().filter(t => {
    if (filter() === 'active') return !t.done
    if (filter() === 'done') return t.done
    return true
  })
  const open = list.filter(t => !t.done).length
  const done = tasks().length - list.filter(t => !t.done).length

  if (keyCleanup) keyCleanup()
  keyCleanup = registerKeyHandler(key => {
    if (confirm() >= 0) {
      if (key === 'escape' || key === 'esc') confirm.$set(-1)
      return
    }
    if (key === 'j' || key === 'down') {
      if (cursor() < list.length - 1) cursor.$set(cursor() + 1)
    } else if (key === 'k' || key === 'up') {
      if (cursor() > 0) cursor.$set(cursor() - 1)
    } else if (key === 'space' || key === ' ') {
      const t = list[cursor()]
      if (t) {
        tasks.$set(tasks().map(x => (x.id === t.id ? { ...x, done: !x.done } : x)))
      }
    } else if (key === 'x') {
      const t = list[cursor()]
      if (t) confirm.$set(t.id as unknown as number)
    } else if (key === '1') {
      filter.$set('all')
      cursor.$set(0)
    } else if (key === '2') {
      filter.$set('active')
      cursor.$set(0)
    } else if (key === '3') {
      filter.$set('done')
      cursor.$set(0)
    }
  })

  function add() {
    const text = draft().trim()
    if (!text) return
    tasks.$set([...tasks(), { id: String(Date.now()), title: text, done: false, tag: 'new' }])
    draft.$set('')
  }

  const FILTERS: Array<[Filter, string]> = [
    ['all', 'all'],
    ['active', 'active'],
    ['done', 'done'],
  ]

  return (
    <vstack gap={0}>
      {/* Header */}
      <hstack gap={1}>
        <text bg="#3d2e1e" fg="#fcd34d">
          {' ▣ Tuix Tasks '}
        </text>
        <text fg={dim}>{`${open} open · ${done} done`}</text>
      </hstack>
      <text> </text>

      {/* Filters */}
      <hstack gap={1}>
        {FILTERS.map(([f, label]) => {
          const active = filter() === f
          return (
            <text key={f} fg={active ? accent : dim} bold={active}>
              {active ? `[ ${label} ]` : ` ${label} `}
            </text>
          )
        })}
        <text fg={dim2}>{`· ${list.length}`}</text>
      </hstack>
      <text> </text>

      {/* Task list — tight padding */}
      <box border="single" borderColor={dim2} padding={{ top: 0, right: 1, bottom: 0, left: 1 }}>
        <vstack gap={0}>
          {list.length === 0 ? (
            <text fg={dim2}>nothing here — type below to add one</text>
          ) : (
            list.map((t, i) => {
              const at = i === cursor()
              return (
                <hstack key={t.id} gap={1}>
                  <text fg={at ? accent : dim2} width={1}>
                    {at ? '>' : ' '}
                  </text>
                  <text fg={t.done ? ok : dim2} width={1}>
                    {t.done ? '✓' : '○'}
                  </text>
                  <text fg={t.done ? dim2 : at ? bright : fg} bold={at}>
                    {t.title}
                  </text>
                  <text fg={dim2}>{` ${t.tag}`}</text>
                </hstack>
              )
            })
          )}
        </vstack>
      </box>
      <text> </text>

      {/* Add input */}
      <hstack gap={1}>
        <text fg={dim2}>{'add'}</text>
        <Input
          bind:value={draft}
          placeholder="task title, enter to add"
          width={36}
          onSubmit={add}
        />
      </hstack>
      <text> </text>

      {/* Hints */}
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
          tasks.$set(tasks().filter(t => t.id !== String(confirm())))
          confirm.$set(-1)
          if (cursor() >= list.length - 1) cursor.$set(Math.max(0, list.length - 2))
        }}
      >
        <text fg={warn}>{list.find(t => t.id === String(confirm()))?.title}</text>
      </Modal>
    </vstack>
  )
}

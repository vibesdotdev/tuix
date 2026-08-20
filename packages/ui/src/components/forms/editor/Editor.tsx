/** @jsxImportSource @tuix/jsx */

import { $state, $effect, type BindableRune, type StateRune, isStateRune, isBindableRune } from '@tuix/reactive'
import { readBound } from '../../../bind'
import { useUITheme } from '../../../theme'

// ---------------------------------------------------------------------------
// Undo ring buffer
// ---------------------------------------------------------------------------

export interface EditorSnapshot {
  content: string
  cursorPos: number
}

const MAX_UNDO = 100

function createUndoRing() {
  const undoStack: EditorSnapshot[] = []
  const redoStack: EditorSnapshot[] = []

  function pushUndo(snapshot: EditorSnapshot) {
    undoStack.push(snapshot)
    if (undoStack.length > MAX_UNDO) undoStack.shift()
    redoStack.length = 0 // clear redo on new edit
  }

  function undo(currentContent: string, currentCursor: number): EditorSnapshot | null {
    if (undoStack.length === 0) return null
    redoStack.push({ content: currentContent, cursorPos: currentCursor })
    return undoStack.pop()!
  }

  function redo(currentContent: string, currentCursor: number): EditorSnapshot | null {
    if (redoStack.length === 0) return null
    undoStack.push({ content: currentContent, cursorPos: currentCursor })
    return redoStack.pop()!
  }

  return { pushUndo, undo, redo }
}

// ---------------------------------------------------------------------------
// Snapshot triggers
// ---------------------------------------------------------------------------

/** Word-boundary characters that trigger a snapshot after text. */
const WORD_BOUNDARY = /[\s.,;:!?(){}\[\]'"\/\\<>@#$%^&*~`+=|\-]/

export interface EditorProps {
  value?: string
  'bind:value'?: BindableRune<string> | StateRune<string>
  language?: string
  placeholder?: string
  rows?: number
  onChange?: (value: string) => void
  className?: string
}

/**
 * Numbered source surface with undo/redo.
 *
 * Keybindings:
 * - `ctrl+z` — undo
 * - `ctrl+shift+z` / `ctrl+y` — redo
 *
 * @example
 * ```tsx
 * <Editor value={src} language="ts" onChange={setSrc} />
 * ```
 */
export function Editor(props: EditorProps): JSX.Element {
  const { depth, theme } = useUITheme()

  // --- Reactive state -------------------------------------------------------
  const raw = String(readBound(props['bind:value']) ?? props.value ?? '')
  const content = $state(raw, 'editor-content')
  const cursorPos = $state(raw.length, 'editor-cursor')

  // --- Undo ring instance ---------------------------------------------------
  const ring = createUndoRing()

  // --- Debounce timer for idle snapshots ------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let prevContent = raw
  let prevLength = raw.length
  let hadTextBeforeBoundary = false

  function scheduleSnapshot() {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      ring.pushUndo({ content: prevContent, cursorPos: cursorPos() })
      prevContent = content()
    }, 300)
  }

  // --- Track content changes ------------------------------------------------
  $effect(() => {
    const current = content()
    if (current === prevContent) return

    const lengthDelta = prevContent.length - current.length

    // Deletion of more than 1 char → immediate snapshot
    if (lengthDelta > 1) {
      if (debounceTimer !== null) { clearTimeout(debounceTimer); debounceTimer = null }
      ring.pushUndo({ content: prevContent, cursorPos: cursorPos() })
      prevContent = current
      prevLength = current.length
      hadTextBeforeBoundary = false
      return
    }

    // Detect word boundary crossing (new char is boundary after text)
    if (current.length > prevLength) {
      const lastChar = current[current.length - 1] ?? ''
      if (WORD_BOUNDARY.test(lastChar) && hadTextBeforeBoundary) {
        if (debounceTimer !== null) { clearTimeout(debounceTimer); debounceTimer = null }
        ring.pushUndo({ content: prevContent, cursorPos: cursorPos() })
        prevContent = current
        hadTextBeforeBoundary = false
        prevLength = current.length
        return
      }
      if (!WORD_BOUNDARY.test(lastChar)) {
        hadTextBeforeBoundary = true
      }
    }

    prevLength = current.length
    // Debounced snapshot for idle pause
    scheduleSnapshot()
  })

  // --- Sync external bind:value changes into local state --------------------
  $effect(() => {
    const bound = props['bind:value']
    if (bound && (isBindableRune(bound) || isStateRune(bound))) {
      const external = String((bound as StateRune<string>)())
      if (external !== content()) {
        content.$set(external)
        cursorPos.$set(external.length)
      }
    }
  })

  // --- Key handler ----------------------------------------------------------
  function handleKeyPress(key: string) {
    if (key === 'ctrl+z') {
      const snapshot = ring.undo(content(), cursorPos())
      if (snapshot) {
        applySnapshot(snapshot)
      }
      return
    }
    if (key === 'ctrl+shift+z' || key === 'ctrl+y') {
      const snapshot = ring.redo(content(), cursorPos())
      if (snapshot) {
        applySnapshot(snapshot)
      }
      return
    }
  }

  function applySnapshot(snapshot: EditorSnapshot) {
    content.$set(snapshot.content)
    cursorPos.$set(snapshot.cursorPos)
    // Propagate to binding and callback
    const bound = props['bind:value']
    if (bound && (isBindableRune(bound) || isStateRune(bound))) {
      ;(bound as StateRune<string>).$set(snapshot.content)
    }
    props.onChange?.(snapshot.content)
    // Reset tracking so restored state doesn't trigger a new snapshot
    prevContent = snapshot.content
    prevLength = snapshot.content.length
  }

  // --- Render ---------------------------------------------------------------
  const text = content()
  const lines = (text.length > 0 ? text : (props.placeholder ?? '')).split('\n')
  const limit = props.rows && props.rows > 0 ? props.rows : lines.length
  const visible = lines.slice(0, limit)
  const gutter = String(Math.max(visible.length, 1)).length

  return (
    <interactive focusable onKeyPress={handleKeyPress} className={props.className}>
      <box
        border="rounded"
        padding={1}
        background={depth.inset}
        borderColor={depth.outset}
      >
        <vstack>
          {props.language ? <text fg={theme.colors.textDim}>{props.language}</text> : null}
          {visible.map((line, index) => (
            <text key={index}>{`${String(index + 1).padStart(gutter, ' ')} │ ${line}`}</text>
          ))}
        </vstack>
      </box>
    </interactive>
  )
}

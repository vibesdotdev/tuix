/**
 * Input Service Implementation V2 - Using BubbleTea-inspired key handling
 */

import { Effect, Layer, Stream, Queue, Chunk, Option, PubSub, Ref } from 'effect'
import { InputService } from '../input'
import { InputError } from '../../types/errors'
import type { KeyEvent, MouseEvent, WindowSize } from '../../types'
import { ANSI_SEQUENCES, parseChar, KeyType } from '@tuix/input/keyboard/keys'
import { BRACKETED_PASTE_START, BRACKETED_PASTE_END, extractBracketedPaste } from '../input/paste'
import { applyKeyToLine, readLineFromQueue } from '../input/line'
import { drainFocusEvents, type FocusEvent } from '../input/focus'

/** Longest-first sequence table, computed once at module load. */
const SORTED_SEQUENCES = Array.from(ANSI_SEQUENCES.entries()).sort(
  (a, b) => b[0].length - a[0].length
)

/**
 * Platform abstraction for input operations
 */
interface PlatformInput {
  readonly stdin: {
    readonly isTTY: boolean
    setEncoding: (encoding: string) => void
    setRawMode?: (enabled: boolean) => void
    on: (event: string, listener: (data: unknown) => void) => void
    removeAllListeners: (event?: string) => void
    removeListener: (event: string, listener: (data: unknown) => void) => void
  }
  readonly stdout: {
    readonly columns?: number
    readonly rows?: number
    write: (data: string) => void
    on: (event: string, listener: () => void) => void
    removeListener: (event: string, listener: () => void) => void
  }
}

/**
 * Get platform-specific input interface
 */
const getPlatform = (): PlatformInput => ({
  stdin: process.stdin,
  stdout: process.stdout,
})

/**
 * Parse mouse events from ANSI sequences
 */
const parseMouseEvent = (sequence: string): MouseEvent | null => {
  // SGR extended mode: ESC [ < btn ; x ; y ; M/m
  let match = sequence.match(/^\x1b\[<(\d+);(-?\d+);(-?\d+)([Mm])/)
  if (match) {
    const info = parseInt(match[1])
    const x = parseInt(match[2])
    const y = parseInt(match[3])
    const isPress = match[4] === 'M'

    const button = info & 0x03
    const shift = !!(info & 0x04)
    const alt = !!(info & 0x08)
    const ctrl = !!(info & 0x10)
    const isWheel = !!(info & 0x40)

    let buttonName: MouseEvent['button']
    let eventType: MouseEvent['type']

    if (isWheel) {
      buttonName = info & 0x01 ? 'wheel-down' : 'wheel-up'
      eventType = 'wheel'
    } else {
      buttonName = button === 0 ? 'left' : button === 1 ? 'middle' : button === 2 ? 'right' : 'none'
      eventType = isPress ? 'press' : 'release'
    }

    return {
      type: eventType,
      button: buttonName,
      x,
      y,
      ctrl,
      alt,
      shift,
    }
  }

  // Basic X10 mouse protocol: ESC [ M <button+32> <x+32> <y+32>
  match = sequence.match(/^\x1b\[M(.)(.)(.)/)
  if (match) {
    // Coordinates and button code are transmitted as single bytes biased by 32.
    const info = (match[1]?.charCodeAt(0) ?? 32) - 32
    const x = (match[2]?.charCodeAt(0) ?? 32) - 32
    const y = (match[3]?.charCodeAt(0) ?? 32) - 32

    const button = info & 0x03
    const shift = !!(info & 0x04)
    const alt = !!(info & 0x08)
    const ctrl = !!(info & 0x10)
    const motion = !!(info & 0x20)
    // X10 has no release event: button code 3 means "no button" (release).
    const release = (info & 0x03) === 3

    let buttonName: MouseEvent['button']
    let eventType: MouseEvent['type']

    if (motion) {
      buttonName = 'none'
      eventType = 'motion'
    } else if (release) {
      buttonName = 'none' // X10 doesn't tell us which button was released
      eventType = 'release'
    } else {
      buttonName = button === 0 ? 'left' : button === 1 ? 'middle' : 'right'
      eventType = 'press'
    }

    return {
      type: eventType,
      button: buttonName,
      x,
      y,
      ctrl,
      alt,
      shift,
    }
  }

  return null
}

/**
 * Parse a buffer of input into key / mouse / paste / focus events.
 * Exported for unit tests of the shipped Live parse path.
 */
export const parseBuffer = (
  buffer: string,
  keyPubSub: PubSub.PubSub<KeyEvent>,
  mousePubSub: PubSub.PubSub<MouseEvent>,
  pastePubSub?: PubSub.PubSub<string>,
  focusPubSub?: PubSub.PubSub<FocusEvent>,
  onKeyPublished?: () => void
): string => {
  while (buffer.length > 0) {
    // Focus in/out (CSI I / CSI O) — must run before generic ANSI key table
    if (focusPubSub) {
      const drained = drainFocusEvents(buffer)
      if (drained.events.length > 0) {
        for (const ev of drained.events) {
          Effect.runSync(PubSub.publish(focusPubSub, ev))
        }
        buffer = drained.rest
        if (buffer.length === 0 || buffer === '\x1b' || buffer === '\x1b[') {
          if (buffer === '\x1b' || buffer === '\x1b[') break
          continue
        }
        continue
      }
      if (buffer === '\x1b' || buffer === '\x1b[') {
        break
      }
    }

    // Bracketed paste (may appear anywhere in the buffer)
    if (pastePubSub && buffer.includes(BRACKETED_PASTE_START)) {
      const extracted = extractBracketedPaste(buffer)
      if (extracted) {
        Effect.runSync(PubSub.publish(pastePubSub, extracted.paste))
        buffer = extracted.rest
        continue
      }
      // Incomplete paste — wait for more data if start is present without end
      if (buffer.includes(BRACKETED_PASTE_START) && !buffer.includes(BRACKETED_PASTE_END)) {
        break
      }
    }

    // Check for SGR mouse events first: ESC [ < btn ; x ; y ; M/m
    const sgrMatch = buffer.match(/^\x1b\[<(\d+);(\d+);(\d+)[Mm]/)
    if (sgrMatch) {
      const mouseSeq = sgrMatch[0]
      buffer = buffer.slice(mouseSeq.length)

      const mouseEvent = parseMouseEvent(mouseSeq)
      if (mouseEvent) {
        Effect.runSync(PubSub.publish(mousePubSub, mouseEvent))
      }
      continue
    }

    // Check for X10 mouse events: ESC [ M <3 bytes>
    if (buffer.startsWith('\x1b[M') && buffer.length >= 6) {
      const mouseSeq = buffer.slice(0, 6)
      buffer = buffer.slice(6)

      const mouseEvent = parseMouseEvent(mouseSeq)
      if (mouseEvent) {
        Effect.runSync(PubSub.publish(mousePubSub, mouseEvent))
      }
      continue
    }

    // Check for known ANSI sequences (longest first)
    let matched = false
    for (const [seq, partial] of SORTED_SEQUENCES) {
      if (buffer.startsWith(seq)) {
        const keyEvent: KeyEvent = {
          type: partial.type || KeyType.Runes,
          key: partial.key || '',
          runes: partial.type === KeyType.Runes ? seq : undefined,
          ctrl: partial.ctrl || false,
          alt: partial.alt || false,
          shift: partial.shift || false,
          meta: false,
          sequence: seq,
        }
        Effect.runSync(PubSub.publish(keyPubSub, keyEvent))
        onKeyPublished?.()
        buffer = buffer.slice(seq.length)
        matched = true
        break
      }
    }

    if (matched) continue

    // Handle Alt+key sequences (ESC followed by a character)
    if (buffer.startsWith('\x1b') && buffer.length > 1 && buffer[1] !== '[') {
      const char = buffer[1]
      const baseKey = parseChar(char)
      const keyEvent: KeyEvent = {
        ...baseKey,
        alt: true,
        key: `alt+${baseKey.runes || baseKey.key}`,
        sequence: buffer.slice(0, 2),
      }
      Effect.runSync(PubSub.publish(keyPubSub, keyEvent))
      onKeyPublished?.()
      buffer = buffer.slice(2)
      continue
    }

    // Handle regular characters
    if (!buffer.startsWith('\x1b') || buffer.length === 1) {
      const char = buffer[0]
      const keyEvent = parseChar(char)
      Effect.runSync(
        PubSub.publish(keyPubSub, {
          ...keyEvent,
          sequence: char,
        })
      )
      onKeyPublished?.()
      buffer = buffer.slice(1)
      continue
    }

    // Incomplete escape sequence - wait for more data
    if (buffer.startsWith('\x1b') && buffer.length < 6) {
      break
    }

    // Unknown sequence - skip the escape character and continue
    console.debug('Unknown ANSI sequence:', buffer.slice(0, Math.min(10, buffer.length)))
    buffer = buffer.slice(1)
  }

  return buffer
}

/**
 * Create the live Input service implementation
 */
export const InputServiceLive = Layer.scoped(
  InputService,
  Effect.gen(function* (_) {
    const platform = getPlatform()
    const stdin = platform.stdin
    // Use PubSub to broadcast events to all consumers
    const keyPubSub = yield* _(PubSub.unbounded<KeyEvent>())
    const mousePubSub = yield* _(PubSub.unbounded<MouseEvent>())
    const pastePubSub = yield* _(PubSub.unbounded<string>())
    const focusPubSub = yield* _(PubSub.unbounded<FocusEvent>())
    /** Keys published and not yet observed via readKey/readLine bookkeeping */
    const pendingKeys = yield* _(Ref.make(0))
    /** Unparsed stdin bytes waiting for more data */
    const pendingRaw = yield* _(Ref.make(0))

    // Start reading from stdin
    yield* _(
      Effect.acquireRelease(
        Effect.sync(() => {
          stdin.setEncoding('utf8')

          // Try to enable raw mode for proper key handling
          const hasTTY = stdin.isTTY && 'setRawMode' in stdin
          if (hasTTY) {
            stdin.setRawMode(true)
          }

          // Setup input handling
          let buffer = ''
          stdin.on('data', (chunk: string) => {
            buffer += chunk
            buffer = parseBuffer(buffer, keyPubSub, mousePubSub, pastePubSub, focusPubSub, () => {
              Effect.runSync(Ref.update(pendingKeys, n => n + 1))
            })
            Effect.runSync(Ref.set(pendingRaw, buffer.length))
          })
        }),
        () =>
          Effect.sync(() => {
            stdin.removeAllListeners('data')
            if (stdin.isTTY && 'setRawMode' in stdin) {
              stdin.setRawMode(false)
            }
          })
      )
    )

    return {
      keyEvents: Stream.fromPubSub(keyPubSub),

      mouseEvents: Stream.fromPubSub(mousePubSub),

      readKey: Stream.fromPubSub(keyPubSub).pipe(
        Stream.take(1),
        Stream.runHead,
        Effect.flatMap(opt =>
          Option.isSome(opt)
            ? Effect.succeed(opt.value).pipe(
                Effect.tap(() => Ref.update(pendingKeys, n => Math.max(0, n - 1)))
              )
            : Effect.fail(
                new InputError({
                  type: 'keyboard',
                  message: 'No key event available',
                })
              )
        )
      ),

      // One continuous PubSub subscription for the whole line — never re-subscribe per key
      // (Effect PubSub drops messages with no subscriber; re-subscribe lost multi-char input).
      // Consume path is readLineFromQueue (unit-tested with multi-char hello+Enter).
      readLine: Effect.scoped(
        Effect.gen(function* (_) {
          const dequeue = yield* _(PubSub.subscribe(keyPubSub))
          return yield* _(
            readLineFromQueue(dequeue, () => Ref.update(pendingKeys, n => Math.max(0, n - 1)))
          )
        })
      ),

      inputAvailable: Effect.gen(function* (_) {
        const pending = yield* _(Ref.get(pendingKeys))
        if (pending > 0) return true
        const raw = yield* _(Ref.get(pendingRaw))
        if (raw > 0) return true
        const rs = stdin as { readableLength?: number }
        if (typeof rs.readableLength === 'number' && rs.readableLength > 0) return true
        return false
      }),

      flushInput: Effect.gen(function* (_) {
        yield* _(Ref.set(pendingKeys, 0))
        yield* _(Ref.set(pendingRaw, 0))
      }),

      filterKeys: predicate => Stream.fromPubSub(keyPubSub).pipe(Stream.filter(predicate)),

      mapKeys: <T>(mapper: (key: KeyEvent) => T | null) =>
        Stream.fromPubSub(keyPubSub).pipe(
          Stream.filterMap((key): Option.Option<T> => {
            const result = mapper(key)
            return result !== null ? Option.some(result) : Option.none()
          })
        ),

      debounceKeys: ms => Stream.fromPubSub(keyPubSub).pipe(Stream.debounce(ms)),

      parseAnsiSequence: sequence =>
        Effect.sync(() => {
          const partial = ANSI_SEQUENCES.get(sequence)
          if (!partial) return null

          return {
            type: partial.type || KeyType.Runes,
            key: partial.key || '',
            runes: partial.type === KeyType.Runes ? sequence : undefined,
            ctrl: partial.ctrl || false,
            alt: partial.alt || false,
            shift: partial.shift || false,
            meta: false,
            sequence,
          }
        }),

      rawInput: Stream.async<Uint8Array>(emit => {
        stdin.on('data', (chunk: unknown) => {
          if (chunk instanceof Buffer) {
            emit(Effect.succeed(Chunk.of(new Uint8Array(chunk))))
          } else if (typeof chunk === 'string') {
            emit(Effect.succeed(Chunk.of(new TextEncoder().encode(chunk))))
          }
        })
      }),

      setEcho: enabled =>
        Effect.try({
          try: () => {
            if (stdin.isTTY && 'setRawMode' in stdin) {
              stdin.setRawMode(!enabled)
            }
          },
          catch: error =>
            new InputError({
              device: 'keyboard',
              cause: error,
            }),
        }),

      // Mouse Control
      enableMouse: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?1000h') // Enable X10 mouse tracking
          platform.stdout.write('\x1b[?1002h') // Enable button event tracking
          platform.stdout.write('\x1b[?1015h') // Enable urxvt extended mode
          platform.stdout.write('\x1b[?1006h') // Enable SGR extended mode
        },
        catch: error =>
          new InputError({
            device: 'mouse',
            cause: error,
          }),
      }),

      disableMouse: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?1000l') // Disable X10 mouse tracking
          platform.stdout.write('\x1b[?1002l') // Disable button event tracking
          platform.stdout.write('\x1b[?1015l') // Disable urxvt extended mode
          platform.stdout.write('\x1b[?1006l') // Disable SGR extended mode
        },
        catch: error =>
          new InputError({
            device: 'mouse',
            cause: error,
          }),
      }),

      enableMouseMotion: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?1003h') // Enable all mouse motion tracking
        },
        catch: error =>
          new InputError({
            device: 'mouse',
            cause: error,
          }),
      }),

      disableMouseMotion: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?1003l') // Disable all mouse motion tracking
        },
        catch: error =>
          new InputError({
            device: 'mouse',
            cause: error,
          }),
      }),

      resizeEvents: Stream.async<WindowSize>(emit => {
        const handleResize = () => {
          emit(
            Effect.succeed(
              Chunk.of({
                width: platform.stdout.columns || 80,
                height: platform.stdout.rows || 24,
              })
            )
          )
        }

        platform.stdout.on('resize', handleResize)
        return Effect.sync(() => {
          platform.stdout.removeListener('resize', handleResize)
        })
      }),

      pasteEvents: Stream.fromPubSub(pastePubSub),

      enableBracketedPaste: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?2004h') // Enable bracketed paste mode
        },
        catch: error =>
          new InputError({
            operation: 'enableBracketedPaste',
            cause: error,
          }),
      }),

      disableBracketedPaste: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?2004l') // Disable bracketed paste mode
        },
        catch: error =>
          new InputError({
            operation: 'disableBracketedPaste',
            cause: error,
          }),
      }),

      enableFocusTracking: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?1004h') // Enable focus tracking
        },
        catch: error =>
          new InputError({
            operation: 'enableFocusTracking',
            cause: error,
          }),
      }),

      disableFocusTracking: Effect.try({
        try: () => {
          platform.stdout.write('\x1b[?1004l') // Disable focus tracking
        },
        catch: error =>
          new InputError({
            operation: 'disableFocusTracking',
            cause: error,
          }),
      }),

      focusEvents: Stream.fromPubSub(focusPubSub),
    }
  })
)

// Re-export pure helpers used by tests of the shipped Live path
export {
  applyKeyToLine,
  accumulateLineFromKeys,
  isEnterKey,
  readLineFromQueue,
} from '../input/line'
export { extractFocusEvent, drainFocusEvents, FOCUS_IN, FOCUS_OUT } from '../input/focus'

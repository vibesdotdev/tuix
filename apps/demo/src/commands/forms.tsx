/** @jsxImportSource @tuix/jsx */

/**
 * Forms — bind:value two-way + focus ring + modal backdrop.
 *
 * Content-sized form card (not forced full-height — the form has a natural
 * size and the terminal shows it as a compact dialog). The modal overlay
 * demonstrates scrim + backdrop click + Escape to close.
 *
 * Keys: [tab] cycle fields · Enter in Email submits · Esc closes modal ·
 *       click outside dismisses
 */

import { $state, $derived } from '@tuix/reactive'
import { Input, Modal, Kbd, KbdHint, useUITheme } from '@tuix/ui'

const LABEL_W = 8
const FIELD_W = 32

export default function Forms() {
  const { theme } = useUITheme()
  const name = $state('', 'name')
  const email = $state('', 'email')
  const confirm = $state(false, 'confirm')
  const sent = $state('', 'sent')

  const preview = $derived(() => `${name() || '—'} <${email() || '—'}>`)

  function submit() {
    confirm.$set(true)
  }

  const dim = theme.colors.textDim ?? '#7d8ca3'
  const dim2 = theme.colors.textDim
  const bright = theme.colors.textBright ?? theme.colors.fg
  const accent = theme.colors.primary

  return (
    <vstack gap={0}>
      {/* Header bar */}
      <hstack gap={1}>
        <text bg="#1e3a5f" fg="#93c5fd">
          {' ◆ Tuix Forms '}
        </text>
        <text fg={dim}>two-way binding, live preview</text>
      </hstack>
      <text> </text>

      {/* Form card — content-sized, bordered */}
      <box border="rounded" borderColor={dim2} padding={1}>
        <hstack gap={1}>
          <text width={LABEL_W} fg={dim2}>
            {'Name'}
          </text>
          <Input bind:value={name} placeholder="your name" width={FIELD_W} />
        </hstack>
        <text> </text>
        <hstack gap={1}>
          <text width={LABEL_W} fg={dim2}>
            {'Email'}
          </text>
          <Input
            bind:value={email}
            placeholder="you@example.com"
            width={FIELD_W}
            onSubmit={submit}
          />
        </hstack>
        <text> </text>
        <text fg={dim2}>{'─'.repeat(LABEL_W + FIELD_W + 1)}</text>
        <text> </text>
        <hstack gap={1}>
          <text width={LABEL_W} fg={dim2}>
            {'Preview'}
          </text>
          <text fg={name() || email() ? bright : dim}>{preview()}</text>
        </hstack>
        {sent() ? (
          <vstack gap={0}>
            <text> </text>
            <hstack gap={1}>
              <text width={LABEL_W} fg={theme.colors.success}>
                {'Sent ✓'}
              </text>
              <text fg={theme.colors.success}>{sent()}</text>
            </hstack>
          </vstack>
        ) : null}
      </box>
      <text> </text>

      {/* Hints */}
      <hstack gap={2}>
        <KbdHint keys="tab" label="cycle fields" />
        <KbdHint keys="enter" label="submit" />
        <KbdHint keys="esc" label="close" />
      </hstack>

      <Modal
        open={confirm()}
        title="Send it?"
        width={44}
        height={8}
        closeOnBackdrop
        onClose={() => confirm.$set(false)}
        onConfirm={() => {
          sent.$set(preview())
          confirm.$set(false)
        }}
      >
        <text fg={bright}>{preview()}</text>
      </Modal>
    </vstack>
  )
}

export { Kbd }

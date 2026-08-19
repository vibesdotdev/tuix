/** @jsxImportSource @tuix/jsx */

/**
 * Forms — bind:value two-way + focus ring + modal backdrop, laid out on a
 * real form grid: label column, uniform field width, hints at the bottom.
 *
 * Keys: [tab] cycle fields · Enter in Email submits · Esc closes modal ·
 *       click outside dismisses
 */

import { $state, $derived } from '@tuix/reactive'
import { Input, Modal, Kbd, KbdHint, useUITheme } from '@tuix/ui'

const LABEL_W = 8
const FIELD_W = 28

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

  return (
    <box padding={1} border="rounded" borderColor={dim2}>
      {/* Header */}
      <hstack gap={1}>
        <text bg="#1e3a5f" fg="#93c5fd">
          {' ◆ Tuix Forms '}
        </text>
        <text fg={dim}>two-way binding, live preview</text>
      </hstack>
      <text> </text>

      {/* Form grid */}
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
        <Input bind:value={email} placeholder="you@example.com" width={FIELD_W} onSubmit={submit} />
      </hstack>
      <text> </text>

      {/* Preview */}
      <hstack gap={1}>
        <text width={LABEL_W} fg={dim2}>
          {'Preview'}
        </text>
        <text fg={bright}>{preview()}</text>
      </hstack>

      {sent() ? (
        <>
          <text> </text>
          <hstack gap={1}>
            <text width={LABEL_W} fg={dim2}>
              {'Sent'}
            </text>
            <text fg={theme.colors.success}>{sent()}</text>
          </hstack>
        </>
      ) : null}

      <text> </text>
      <text> </text>

      {Array.from({ length: Math.max(0, (process.stdout.rows ?? 24) - 14) }, (_, i) => (
        <text key={`f-${i}`}> </text>
      ))}

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
        <text>{preview()}</text>
      </Modal>
    </box>
  )
}

export { Kbd }

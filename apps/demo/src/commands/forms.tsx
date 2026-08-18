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
  const bright = theme.colors.textBright ?? theme.colors.fg

  return (
    <box padding={1}>
      <vstack gap={0}>
        {/* Header: chip + one-line summary */}
        <hstack gap={1}>
          <text bg={theme.colors.primary} fg={theme.colors.bg}>
            {' Tuix Forms '}
          </text>
          <text fg={dim}>two-way binding, live preview</text>
        </hstack>
        <text> </text>

        {/* Form grid: aligned label column, uniform field width */}
        <hstack gap={1}>
          <text width={LABEL_W} fg={dim}>
            {'Name'}
          </text>
          <Input bind:value={name} placeholder="your name" width={FIELD_W} />
        </hstack>
        <text> </text>
        <hstack gap={1}>
          <text width={LABEL_W} fg={dim}>
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

        {/* Live derived preview */}
        <hstack gap={1}>
          <text width={LABEL_W} fg={dim}>
            {'Preview'}
          </text>
          <text fg={bright}>{preview()}</text>
        </hstack>

        {sent() ? (
          <hstack gap={1}>
            <text width={LABEL_W} fg={dim}>
              {'Sent'}
            </text>
            <text fg={theme.colors.success}>{sent()}</text>
          </hstack>
        ) : null}

        <text> </text>
        <text> </text>

        {/* Hints pinned below the form */}
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
      </vstack>
    </box>
  )
}

export { Kbd }

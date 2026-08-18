/** @jsxImportSource @tuix/jsx */

/**
 * Forms Command — proves the svelte-alike loop end to end:
 * bind:value write-back, Tab focus cycling, $derived preview, and a Modal
 * with backdrop dismissal. Live state is shown on a status line so PTY
 * captures can assert every transition.
 */

import { $state, $derived } from '@tuix/reactive'
import { Input, Modal, Kbd } from '@tuix/ui'
import { style } from '@tuix/ansi'

export default function Forms() {
  const name = $state('', 'name')
  const email = $state('', 'email')
  const confirm = $state(false, 'confirm')
  const sent = $state('', 'sent')

  const preview = $derived(() => `${name() || '—'} <${email() || '—'}>`)

  function submit() {
    confirm.$set(true)
  }

  return (
    <vstack gap={1}>
      <text style={style().bold()}>Forms — bind:value + focus ring</text>
      <text>
        <Kbd>Tab</Kbd> cycles fields · Enter in Email submits · Esc closes modal · click backdrop
        dismisses
      </text>
      <hstack gap={1}>
        <text width={8}>Name</text>
        <Input bind:value={name} placeholder="your name" />
      </hstack>
      <hstack gap={1}>
        <text width={8}>Email</text>
        <Input bind:value={email} placeholder="you@example.com" onSubmit={submit} />
      </hstack>
      <text>Preview: {preview()}</text>
      {sent() ? <text style={style().fg('green')}>Sent: {sent()}</text> : null}
      <text>status: {confirm() ? 'modal:open' : 'modal:closed'}</text>
      <Modal
        open={confirm()}
        title="Send it?"
        width={40}
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
  )
}

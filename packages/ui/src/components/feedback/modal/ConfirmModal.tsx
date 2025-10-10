import { Modal, type ModalProps } from './Modal'

export interface ConfirmModalProps
  extends Omit<
    ModalProps,
    'title' | 'description' | 'variant' | 'isOpen' | 'onConfirm' | 'onCancel'
  > {
  readonly title: string
  readonly message: string
  readonly onConfirm: () => void
  readonly onCancel?: () => void
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly isOpen?: boolean
}

export function ConfirmModal(props: ConfirmModalProps) {
  const { title, message, onConfirm, onCancel, confirmLabel, cancelLabel, isOpen, ...rest } = props

  return (
    <Modal
      title={title}
      description={message}
      variant="warning"
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmLabel={confirmLabel ?? 'Yes'}
      cancelLabel={cancelLabel ?? 'No'}
      isOpen={isOpen ?? true}
      {...rest}
    />
  )
}

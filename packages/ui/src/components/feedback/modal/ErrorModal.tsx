import { Modal, type ModalProps } from './Modal'

export interface ErrorModalProps
  extends Omit<ModalProps, 'title' | 'description' | 'variant' | 'isOpen'> {
  readonly title: string
  readonly error: string
  readonly isOpen?: boolean
}

export function ErrorModal(props: ErrorModalProps) {
  const { title, error, isOpen, ...rest } = props

  return (
    <Modal
      title={title}
      description={`⚠ ${error}`}
      variant="error"
      isOpen={isOpen ?? true}
      {...rest}
    />
  )
}

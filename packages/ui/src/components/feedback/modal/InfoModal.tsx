import { Modal, type ModalProps } from './Modal'

export interface InfoModalProps
  extends Omit<ModalProps, 'title' | 'description' | 'variant' | 'isOpen'> {
  readonly title: string
  readonly message: string
  readonly isOpen?: boolean
}

export function InfoModal(props: InfoModalProps) {
  const { title, message, isOpen, ...rest } = props

  return (
    <Modal title={title} description={message} variant="info" isOpen={isOpen ?? true} {...rest} />
  )
}

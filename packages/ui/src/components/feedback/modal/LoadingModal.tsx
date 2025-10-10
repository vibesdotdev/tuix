import { style } from '@tuix/ansi'
import { Spinner } from '../spinner/Spinner'
import { Modal, type ModalProps } from './Modal'

export interface LoadingModalProps
  extends Omit<
    ModalProps,
    | 'title'
    | 'description'
    | 'variant'
    | 'isOpen'
    | 'showCloseButton'
    | 'closeOnBackdrop'
    | 'closeOnEscape'
    | 'footer'
  > {
  readonly title: string
  readonly message: string
  readonly isOpen?: boolean
}

export function LoadingModal(props: LoadingModalProps) {
  const { title, message, isOpen, ...rest } = props

  return (
    <Modal
      title={title}
      description={message}
      variant="info"
      isOpen={isOpen ?? true}
      showCloseButton={false}
      closeOnBackdrop={false}
      closeOnEscape={false}
      footer={
        <hstack gap={1} align="middle" justify="center">
          <Spinner size="small" />
          <text style={style().italic()}>Working…</text>
        </hstack>
      }
      {...rest}
    />
  )
}

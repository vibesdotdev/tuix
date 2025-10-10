/**
 * Form Component - Form container with validation
 *
 * @example
 * ```tsx
 * import { Form, TextInput, Button } from '@tuix/ui'
 *
 * function LoginForm() {
 *   const username = $state('')
 *   const password = $state('')
 *
 *   const handleSubmit = (data: Record<string, any>) => {
 *     console.log('Form submitted:', data)
 *   }
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <TextInput bind:value={username} label="Username" required />
 *       <TextInput bind:value={password} label="Password" type="password" required />
 *       <Button type="submit">Login</Button>
 *     </Form>
 *   )
 * }
 * ```
 */

import { $state, $derived } from '@tuix/reactive/runes/runes'
import { style, colors, border } from '@tuix/ansi'

export interface FormField {
  name: string
  value: any
  required?: boolean
  validate?: (value: any) => string | null
}

export interface FormProps {
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
  onValidationError?: (errors: Record<string, string>) => void
  children?: any
  className?: string
  showErrors?: boolean
}

/**
 * Form Component
 */
export function Form(props: FormProps): JSX.Element {
  const isSubmitting = $state(false)
  const errors = $state<Record<string, string>>({})
  const touched = $state<Record<string, boolean>>({})

  const showErrors = props.showErrors ?? true

  // Collect form data from children
  function collectFormData(): Record<string, any> {
    // In a real implementation, this would traverse children
    // and collect data from form inputs
    // For now, return empty object
    return {}
  }

  // Validate all fields
  function validateForm(): Record<string, string> {
    const formErrors: Record<string, string> = {}

    // In a real implementation, this would validate all form fields
    // based on their validation rules

    return formErrors
  }

  // Handle form submission
  async function handleSubmit() {
    if (isSubmitting()) return

    const formErrors = validateForm()
    errors.$set(formErrors)

    if (Object.keys(formErrors).length > 0) {
      props.onValidationError?.(formErrors)
      return
    }

    isSubmitting.$set(true)

    try {
      const data = collectFormData()
      await props.onSubmit?.(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      isSubmitting.$set(false)
    }
  }

  // Keyboard handler
  function handleKeyPress(key: string) {
    if (key === 'Enter' && (key.includes('Ctrl') || key.includes('Meta'))) {
      handleSubmit()
    }
  }

  // Render
  const formStyle = style().padding(1)

  const errorEntries = Object.entries(errors())

  return (
    <interactive onKeyPress={handleKeyPress} focusable={false} className={props.className}>
      <vstack gap={1}>
        <box style={formStyle}>{props.children}</box>

        {showErrors && errorEntries.length > 0 && (
          <box
            style={style()
              .padding(1)
              .border(border.borderStyle('thin'))
              .borderFg(colors.red)
              .background(colors.black)}
          >
            <vstack>
              <text style={style().foreground(colors.red).bold()}>Validation Errors:</text>
              {errorEntries.map(([field, error]) => (
                <text key={field} style={style().foreground(colors.red)}>
                  {`• ${field}: ${error}`}
                </text>
              ))}
            </vstack>
          </box>
        )}

        {isSubmitting() && (
          <text style={style().foreground(colors.blue).italic()}>Submitting...</text>
        )}
      </vstack>
    </interactive>
  )
}

// Factory function
export const form = (props: FormProps) => <Form {...props} />

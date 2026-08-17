/**
 * Form Component - Form container with validation
 *
 * Fields are declared, not scraped from children. Each field is a getter
 * (usually a rune read) plus optional validation, so submit always sees
 * live values:
 *
 * @example
 * ```tsx
 * import { Form, Input, Button } from '@tuix/ui'
 * import { required, minLength } from '@tuix/ui/validation'
 *
 * function LoginForm() {
 *   const username = $state('')
 *   const password = $state('')
 *
 *   return (
 *     <Form
 *       fields={{
 *         username: { value: () => username(), required: true, validate: minLength(3) },
 *         password: { value: () => password(), required: true },
 *       }}
 *       onSubmit={data => login(data.username, data.password)}
 *     >
 *       <Input bind:value={username} placeholder="Username" />
 *       <Input bind:value={password} placeholder="Password" />
 *       <Button variant="primary" type="submit">Login</Button>
 *     </Form>
 *   )
 * }
 * ```
 */

import { $state } from '@tuix/reactive/runes/runes'
import { style, colors, border } from '@tuix/ansi'

export interface FormFieldDef<T = unknown> {
  /** Live value getter — usually `() => rune()`. */
  value: () => T
  /** Treat empty strings / null / undefined as errors. */
  required?: boolean
  /** Extra rule returning an error message or null. */
  validate?: (value: T) => string | null
}

export type FormFields = Record<string, FormFieldDef>

export interface FormProps {
  /** Declared fields collected into the submit payload. */
  fields?: FormFields
  onSubmit?: (data: Record<string, any>) => void | Promise<void>
  onValidationError?: (errors: Record<string, string>) => void
  children?: any
  className?: string
  showErrors?: boolean
}

/** Read every declared field's live value. */
export function collectFormData(fields: FormFields): Record<string, any> {
  const data: Record<string, any> = {}
  for (const [name, field] of Object.entries(fields)) {
    try {
      data[name] = field.value()
    } catch {
      /* a dead getter contributes nothing */
    }
  }
  return data
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

/** Run required + per-field rules; returns field → message. */
export function validateFormFields(fields: FormFields): Record<string, string> {
  const formErrors: Record<string, string> = {}
  for (const [name, field] of Object.entries(fields)) {
    const value = field.value()
    if (field.required && isEmpty(value)) {
      formErrors[name] = 'This field is required'
      continue
    }
    const message = field.validate?.(value) ?? null
    if (message) formErrors[name] = message
  }
  return formErrors
}

/**
 * Form Component
 */
export function Form(props: FormProps): JSX.Element {
  const isSubmitting = $state(false)
  const errors = $state<Record<string, string>>({})

  const showErrors = props.showErrors ?? true
  const fields = props.fields ?? {}

  // Handle form submission
  async function handleSubmit() {
    if (isSubmitting()) return

    const formErrors = validateFormFields(fields)
    errors.$set(formErrors)

    if (Object.keys(formErrors).length > 0) {
      props.onValidationError?.(formErrors)
      return
    }

    isSubmitting.$set(true)

    try {
      const data = collectFormData(fields)
      await props.onSubmit?.(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      isSubmitting.$set(false)
    }
  }

  // Keyboard handler: ctrl+enter / meta+enter submits
  function handleKeyPress(key: string) {
    const lower = key.toLowerCase()
    if (lower === 'ctrl+enter' || lower === 'meta+enter' || lower === 'command+enter') {
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

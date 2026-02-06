import { describe, it, expect } from 'bun:test'
import { Toast, infoToast, successToast, warningToast, errorToast } from './Toast'

describe('Toast', () => {
  it('should render with message', () => {
    const element = <Toast message="Hello!" />
    expect(element).toBeDefined()
  })

  it('should render with icon', () => {
    const element = <Toast message="Success!" icon="✓" kind="success" />
    expect(element).toBeDefined()
  })

  it('should not render when open is false', () => {
    // Test the component function directly (not JSX)
    const result = Toast({ message: "Hidden", open: false })
    expect(result).toBeNull()
  })

  it('should support different kinds', () => {
    const info = <Toast message="Info" kind="info" />
    const success = <Toast message="Success" kind="success" />
    const warning = <Toast message="Warning" kind="warning" />
    const error = <Toast message="Error" kind="error" />

    expect(info).toBeDefined()
    expect(success).toBeDefined()
    expect(warning).toBeDefined()
    expect(error).toBeDefined()
  })

  it('should have convenience functions', () => {
    expect(infoToast('Info message')).toBeDefined()
    expect(successToast('Success message')).toBeDefined()
    expect(warningToast('Warning message')).toBeDefined()
    expect(errorToast('Error message')).toBeDefined()
  })
})

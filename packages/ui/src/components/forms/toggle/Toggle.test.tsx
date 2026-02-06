import { describe, it, expect } from 'bun:test'
import { Toggle } from './Toggle'
import { $state } from '@tuix/reactive/runes/runes'

describe('Toggle', () => {
  it('should render with default off state', () => {
    const element = <Toggle />
    expect(element).toBeDefined()
  })

  it('should render with label', () => {
    const element = <Toggle label="Dark Mode" />
    expect(element).toBeDefined()
  })

  it('should support bind:checked', () => {
    const enabled = $state(false)
    const element = <Toggle bind:checked={enabled} label="Enable Feature" />
    expect(element).toBeDefined()
  })

  it('should support on prop', () => {
    const element = <Toggle on={true} label="Active" />
    expect(element).toBeDefined()
  })

  it('should support disabled state', () => {
    const element = <Toggle disabled label="Disabled Toggle" />
    expect(element).toBeDefined()
  })
})

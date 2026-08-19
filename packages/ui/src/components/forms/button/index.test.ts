/**
 * Tests for index.ts — re-exports are exercised by Button.test.tsx.
 */

import { describe, test, expect } from 'bun:test'
import {
  Button,
  button,
  primaryButton,
  secondaryButton,
  successButton,
  dangerButton,
  warningButton,
  infoButton,
  ghostButton,
  ButtonGroup,
  SubmitCancelButtons,
} from './index'

describe('UI Components Forms Button Index', () => {
  test('re-exports Button and variant helpers', () => {
    expect(Button).toBeTypeOf('function')
    expect(button).toBeTypeOf('function')
    expect(primaryButton).toBeTypeOf('function')
    expect(secondaryButton).toBeTypeOf('function')
    expect(successButton).toBeTypeOf('function')
    expect(dangerButton).toBeTypeOf('function')
    expect(warningButton).toBeTypeOf('function')
    expect(infoButton).toBeTypeOf('function')
    expect(ghostButton).toBeTypeOf('function')
    expect(ButtonGroup).toBeTypeOf('function')
    expect(SubmitCancelButtons).toBeTypeOf('function')
  })
})

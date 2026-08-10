import { describe, expect, test } from 'bun:test'
import { TuixApp, WelcomeScreen, VersionCommand, HelpCommand, DashboardCommand } from './index'

describe('@tuix/bin exports', () => {
  test('exports core CLI components', () => {
    expect(TuixApp).toBeDefined()
    expect(WelcomeScreen).toBeDefined()
    expect(VersionCommand).toBeDefined()
    expect(HelpCommand).toBeDefined()
    expect(DashboardCommand).toBeDefined()
  })
})

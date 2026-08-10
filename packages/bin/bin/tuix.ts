#!/usr/bin/env bun

/**
 * TUIX Command Line Tool
 *
 * Main binary for TUIX framework utilities
 * Dogfoods the CLI framework with JSX components
 */

import { render } from '@tuix/cli'
import { TuixCLI } from './app'

// Run the CLI application
render(TuixCLI)

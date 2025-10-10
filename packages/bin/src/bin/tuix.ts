#!/usr/bin/env bun

/**
 * TUIX CLI - Entry point
 *
 * The main entry point for the TUIX command-line interface.
 */

import { runApp } from '@tuix/jsx'
import { TuixApp } from '../app'

// Run the TUIX CLI app
runApp(TuixApp)

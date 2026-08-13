#!/usr/bin/env bun
/** @jsxImportSource @tuix/jsx */

/**
 * Tuix Demo App
 *
 * Demonstrates JSX-based TUI with the runtime
 */

import { runApp } from '@tuix/jsx'
import App from './app'

const kit = process.argv.includes('kit')
await runApp(App, { fps: kit ? 2 : 60 })

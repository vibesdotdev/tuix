#!/usr/bin/env bun
/** @jsxImportSource @tuix/jsx */

/**
 * Tuix Demo App
 *
 * Demonstrates JSX-based TUI with the runtime
 */

import { runApp } from '@tuix/runtime'
import App from "./app";

await runApp(App)

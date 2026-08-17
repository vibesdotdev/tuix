/**
 * TUIX CLI - Version source
 *
 * Single source of truth: the @tuix/bin package version.
 */

import pkg from '../package.json'

export const VERSION: string = pkg.version

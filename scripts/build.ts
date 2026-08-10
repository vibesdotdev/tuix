#!/usr/bin/env bun

import { Glob } from 'bun'
import { parseArgs } from 'util'
import path from 'path'

const { positionals } = parseArgs({
  args: Bun.argv.slice(2),
  strict: true,
  allowPositionals: true,
})

const globEntry = positionals.length ? positionals : ['./packages/*/src/index.ts']

for (const entry of globEntry) {
  console.info(`Scanning ${entry}`)
  const packages = new Glob(entry)
  for await (const pkg of packages.scan('.')) {
    console.info(`Building ${pkg}`)
    // For packages/*/src/index.ts, we want dist at packages/*/dist
    const packageRoot = path.dirname(path.dirname(pkg))
    await Bun.build({
      entrypoints: [pkg],
      target: 'bun',
      minify: true,
      splitting: true,
      outdir: path.join(packageRoot, 'dist'),
    }).catch(error => {
      console.error(`=`.repeat(80))
      console.error(`Error building ${pkg}:`)
      console.error(`-`.repeat(80))
      console.error(error)
      console.error(`=`.repeat(80))
    })
  }
}

console.info('Build completed')

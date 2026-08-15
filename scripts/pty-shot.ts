#!/usr/bin/env bun
/**
 * Photograph the kit workbench through terminal-web's live xterm (real PTY).
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const TUIX = resolve(import.meta.dir, '..')
const DEMO = resolve(TUIX, 'apps/demo')
const TERMINAL_WEB = resolve(TUIX, '../../apps/terminal-web')
const OUT = resolve(TUIX, 'docs/evidence')
const PORT = Number(process.env.TERMINAL_WEB_PORT ?? 5599)
const BUN = process.env.BUN ?? process.execPath

async function httpOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(800) })
    return res.ok || res.status === 404
  } catch {
    return false
  }
}

async function startServer(): Promise<() => void> {
  const baseURL = `http://127.0.0.1:${PORT}`
  if (await httpOk(baseURL)) return () => {}
  const child: ChildProcess = spawn(
    BUN,
    ['--bun', 'vite', 'dev', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: TERMINAL_WEB,
      env: { ...process.env, PATH: `/Users/aewing/.bun/bin:${process.env.PATH ?? ''}` },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )
  const deadline = Date.now() + 90_000
  while (Date.now() < deadline) {
    if (await httpOk(baseURL)) {
      return () => {
        child.kill('SIGTERM')
      }
    }
    await Bun.sleep(250)
  }
  child.kill('SIGTERM')
  throw new Error(`terminal-web did not start on ${baseURL}`)
}

function shotUrl(cols: number, rows: number): string {
  const url = new URL(`http://127.0.0.1:${PORT}/`)
  url.searchParams.set('cmd', BUN)
  url.searchParams.append('arg', 'src/index.ts')
  url.searchParams.append('arg', 'kit')
  url.searchParams.set('cwd', DEMO)
  url.searchParams.set('cols', String(cols))
  url.searchParams.set('rows', String(rows))
  return url.toString()
}

async function readBuffer(page: import('playwright').Page): Promise<string> {
  return page.evaluate(() => {
    const read = (window as unknown as { __vibesReadTerminalBuffer?: () => string })
      .__vibesReadTerminalBuffer
    return read ? read() : ''
  })
}

async function waitFor(
  page: import('playwright').Page,
  re: RegExp,
  timeoutMs: number
): Promise<string> {
  const deadline = Date.now() + timeoutMs
  let text = ''
  while (Date.now() < deadline) {
    text = await readBuffer(page)
    if (re.test(text)) return text
    await page.waitForTimeout(250)
  }
  throw new Error(`wait failed. Last frame (${text.length} chars):\n${text.slice(0, 1500)}`)
}

async function shoot(page: import('playwright').Page, name: string): Promise<void> {
  const path = resolve(OUT, name)
  const surface = page.locator('.xterm').first()
  if (await surface.count()) await surface.screenshot({ path })
  else await page.screenshot({ path })
  console.log(`wrote ${path}`)
}

async function openKit(
  browser: import('playwright').Browser,
  cols: number,
  rows: number,
  viewport: { width: number; height: number }
) {
  const page = await browser.newPage({ viewport })
  const url = shotUrl(cols, rows)
  console.log(url)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForFunction(
    () =>
      Boolean(
        (window as unknown as { __vibesTerminalInputReady?: boolean }).__vibesTerminalInputReady
      ),
    undefined,
    { timeout: 90_000 }
  )
  const text = await waitFor(page, /rewrite auth/, 90_000)
  return { page, text }
}

mkdirSync(OUT, { recursive: true })
const stop = await startServer()
const browser = await chromium.launch()
try {
  const compact = await openKit(browser, 80, 24, { width: 680, height: 460 })
  const term = compact.page.locator('.xterm-helper-textarea, .xterm').first()
  await term.click({ force: true })
  await shoot(compact.page, 'kit-80x24-idle.png')
  await compact.page.keyboard.type('hello')
  await waitFor(compact.page, /hello/, 8_000).catch(() => {})
  await shoot(compact.page, 'kit-80x24-type.png')
  for (let i = 0; i < 8; i++) await compact.page.keyboard.press('Backspace')
  await compact.page.keyboard.press('Tab')
  await waitFor(compact.page, /sessions\s+·|focus.*sessions|·  sessions/, 8_000).catch(() => {})
  await shoot(compact.page, 'kit-80x24-tab.png')
  await compact.page.keyboard.press('Escape')
  await compact.page.keyboard.type('/')
  await waitFor(compact.page, /Command|Type a command|New session/, 8_000).catch(() => {})
  await shoot(compact.page, 'kit-80x24-slash.png')
  await compact.page.keyboard.press('Escape')
  await compact.page.waitForTimeout(300)
  await compact.page.keyboard.type('?')
  await waitFor(compact.page, /tab cycles|Keys/, 8_000).catch(() => {})
  await shoot(compact.page, 'kit-80x24-help.png')
  await compact.page.close()

  const wide = await openKit(browser, 120, 40, { width: 1280, height: 800 })
  await shoot(wide.page, 'kit-120x40-idle.png')
  await wide.page.close()
} finally {
  await browser.close()
  stop()
}

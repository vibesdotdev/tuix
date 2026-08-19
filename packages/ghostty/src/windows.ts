/**
 * Ghostty window discovery on macOS via CGWindowList.
 *
 * The lister is a small Swift program (run with `swift`, no compile step):
 * JXA's CoreGraphics bridge is unreliable, and Swift has first-class access.
 */

import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSyncText } from './exec'

export interface GhosttyWindowInfo {
  id: number
  title: string
  pid: number
  x: number
  y: number
  w: number
  h: number
}

const SWIFT_LISTER = /* swift */ `
import CoreGraphics
import Foundation

let opts = CGWindowListOption([.optionOnScreenOnly, .excludeDesktopElements])
guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else {
    print("[]")
    exit(0)
}
var out: [[String: Any]] = []
for w in list {
    guard let owner = w["kCGWindowOwnerName"] as? String else { continue }
    if owner.lowercased() != "ghostty" { continue }
    let bounds = w["kCGWindowBounds"] as? [String: Any] ?? [:]
    out.append([
        "id": w["kCGWindowNumber"] ?? 0,
        "title": w["kCGWindowName"] as? String ?? "",
        "pid": w["kCGWindowOwnerPID"] ?? 0,
        "x": bounds["X"] ?? 0,
        "y": bounds["Y"] ?? 0,
        "w": bounds["Width"] ?? 0,
        "h": bounds["Height"] ?? 0,
    ])
}
let data = try! JSONSerialization.data(withJSONObject: out)
print(String(data: data, encoding: .utf8)!)
`

let listerPath: string | null = null

function ensureLister(): string {
  if (listerPath) return listerPath
  const dir = mkdtempSync(join(tmpdir(), 'tuix-ghostty-'))
  listerPath = join(dir, 'windows.swift')
  writeFileSync(listerPath, SWIFT_LISTER, 'utf8')
  return listerPath
}

/** Parse the Swift lister's JSON output. Pure; unit-tested. */
export function parseWindowsJson(text: string): GhosttyWindowInfo[] {
  const trimmed = text.trim()
  if (!trimmed.startsWith('[')) return []
  const raw = JSON.parse(trimmed) as Array<Record<string, unknown>>
  return raw
    .filter(w => typeof w.id === 'number')
    .map(w => ({
      id: Number(w.id),
      title: String(w.title ?? ''),
      pid: Number(w.pid ?? 0),
      x: Number(w.x ?? 0),
      y: Number(w.y ?? 0),
      w: Number(w.w ?? 0),
      h: Number(w.h ?? 0),
    }))
}

/** List on-screen Ghostty windows (macOS). */
export function listGhosttyWindows(exec = execSyncText): GhosttyWindowInfo[] {
  return parseWindowsJson(exec(`swift ${ensureLister()}`))
}

/** Find the window whose title starts with `prefix` (our forced titles). */
export function findWindowByTitlePrefix(
  windows: GhosttyWindowInfo[],
  prefix: string
): GhosttyWindowInfo | null {
  return windows.find(w => w.title.startsWith(prefix)) ?? null
}

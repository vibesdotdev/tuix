/**
 * Kitty graphics protocol encode/decode (pure).
 * @see https://sw.kovidgoyal.net/kitty/graphics-protocol/
 */

const ESC = '\x1b'

export interface KittyImageOptions {
  /** Image id (a=T transmission, i=id) */
  id?: number
  /** Placement id */
  placementId?: number
  /** Columns for display (c) */
  columns?: number
  /** Rows for display (r) */
  rows?: number
  /** Delete after display */
  deleteAfter?: boolean
}

/**
 * Encode RGBA/RGB/PNG bytes as kitty direct transmission (base64 chunks).
 * action a=T (transmit + display), f=24 RGB or f=32 RGBA, t=d direct.
 */
export function encodeKittyImage(
  data: Uint8Array | Buffer,
  width: number,
  height: number,
  format: 'rgb' | 'rgba' | 'png' = 'rgb',
  options: KittyImageOptions = {}
): string {
  if (width <= 0 || height <= 0) throw new Error('kitty: width/height must be positive')

  const f = format === 'png' ? 100 : format === 'rgba' ? 32 : 24
  const id = options.id ?? 1
  const parts: string[] = []

  const b64 = Buffer.from(data).toString('base64')
  const chunkSize = 4096
  const chunks: string[] = []
  for (let i = 0; i < b64.length; i += chunkSize) {
    chunks.push(b64.slice(i, i + chunkSize))
  }
  if (chunks.length === 0) chunks.push('')

  for (let i = 0; i < chunks.length; i++) {
    const more = i < chunks.length - 1 ? 1 : 0
    const ctrl: string[] = [
      `a=T`,
      `f=${f}`,
      `t=d`,
      `i=${id}`,
      `s=${width}`,
      `v=${height}`,
      `m=${more}`,
    ]
    if (options.placementId != null) ctrl.push(`p=${options.placementId}`)
    if (options.columns != null) ctrl.push(`c=${options.columns}`)
    if (options.rows != null) ctrl.push(`r=${options.rows}`)
    if (options.deleteAfter) ctrl.push(`d=a`)
    parts.push(`${ESC}_G${ctrl.join(',')};${chunks[i]}${ESC}\\`)
  }

  return parts.join('')
}

export interface DecodedKitty {
  width: number
  height: number
  format: number
  id: number
  data: Uint8Array
}

/**
 * Decode kitty direct-transmission payloads (concatenated _G sequences).
 */
export function decodeKittyImage(payload: string): DecodedKitty {
  const re = /\x1b_G([^;]*);([A-Za-z0-9+/=]*)\x1b\\/g
  let width = 0
  let height = 0
  let format = 24
  let id = 1
  let b64 = ''
  let m: RegExpExecArray | null
  let found = false
  while ((m = re.exec(payload)) !== null) {
    found = true
    const ctrl = m[1]!
    for (const part of ctrl.split(',')) {
      const [k, v] = part.split('=')
      if (k === 's') width = Number(v)
      if (k === 'v') height = Number(v)
      if (k === 'f') format = Number(v)
      if (k === 'i') id = Number(v)
    }
    b64 += m[2] ?? ''
  }
  if (!found) throw new Error('kitty: no graphics sequences found')
  const data = new Uint8Array(Buffer.from(b64, 'base64'))
  return { width, height, format, id, data }
}

export function isKittyPayload(data: string): boolean {
  return data.includes('\x1b_G')
}

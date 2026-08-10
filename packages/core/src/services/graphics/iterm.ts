/**
 * iTerm2 inline image protocol encode/decode (pure).
 * OSC 1337 ; File=... : base64 BEL
 */

const BEL = '\x07'
const OSC = '\x1b]'

export interface ITermImageOptions {
  name?: string
  width?: number | string
  height?: number | string
  preserveAspectRatio?: boolean
  inline?: boolean
}

/**
 * Encode binary image (typically PNG/JPEG bytes) for iTerm2 inline display.
 */
export function encodeITermImage(
  data: Uint8Array | Buffer,
  options: ITermImageOptions = {}
): string {
  const b64 = Buffer.from(data).toString('base64')
  const name = Buffer.from(options.name ?? 'image').toString('base64')
  const parts = [
    `name=${name}`,
    `size=${data.length}`,
    `inline=${options.inline === false ? 0 : 1}`,
  ]
  if (options.width != null) parts.push(`width=${options.width}`)
  if (options.height != null) parts.push(`height=${options.height}`)
  if (options.preserveAspectRatio === false) parts.push('preserveAspectRatio=0')
  return `${OSC}1337;File=${parts.join(':')}:${b64}${BEL}`
}

export interface DecodedITerm {
  name: string
  size: number
  data: Uint8Array
  width?: string
  height?: string
  inline: boolean
}

/**
 * Decode an iTerm2 File= OSC payload.
 * Format: ESC ] 1337 ; File= key=value : key=value : ... : base64 BEL
 */
export function decodeITermImage(payload: string): DecodedITerm {
  const start = payload.indexOf('\x1b]1337;File=')
  if (start < 0) throw new Error('iterm: invalid inline image payload')
  const bodyStart = start + '\x1b]1337;File='.length
  const bel = payload.indexOf('\x07', bodyStart)
  if (bel < 0) throw new Error('iterm: missing BEL terminator')
  const body = payload.slice(bodyStart, bel)
  // Last colon-separated segment is base64 payload
  const lastColon = body.lastIndexOf(':')
  if (lastColon < 0) throw new Error('iterm: missing base64 segment')
  const meta = body.slice(0, lastColon)
  const b64 = body.slice(lastColon + 1)
  const fields: Record<string, string> = {}
  for (const part of meta.split(':')) {
    const eq = part.indexOf('=')
    if (eq > 0) fields[part.slice(0, eq)] = part.slice(eq + 1)
  }
  const name = fields.name ? Buffer.from(fields.name, 'base64').toString('utf8') : 'image'
  const data = new Uint8Array(Buffer.from(b64, 'base64'))
  return {
    name,
    size: Number(fields.size) || data.length,
    data,
    width: fields.width,
    height: fields.height,
    inline: fields.inline !== '0',
  }
}

export function isITermPayload(data: string): boolean {
  return data.includes('\x1b]1337;File=')
}

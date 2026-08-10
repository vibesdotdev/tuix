/**
 * Terminal graphics protocols: sixel, kitty, iterm2.
 * Cell rendering remains the default path; these are additive encode/decode.
 */

import type { TerminalCapabilities } from '../../types/schemas'
import { selectGraphicsProtocol, type GraphicsProtocol } from '../capabilities/detect'
import { encodeSixel, decodeSixel, isSixelPayload } from './sixel'
import { encodeKittyImage, decodeKittyImage, isKittyPayload } from './kitty'
import { encodeITermImage, decodeITermImage, isITermPayload } from './iterm'

export * from './sixel'
export * from './kitty'
export * from './iterm'

export interface ImageEncodeInput {
  /** Raw pixels for sixel/kitty rgb paths, or PNG/JPEG bytes for iterm/png */
  data: Uint8Array | Buffer | number[]
  width: number
  height: number
  channels?: 1 | 3 | 4
  format?: 'rgb' | 'rgba' | 'png' | 'gray'
  name?: string
}

export interface EncodedGraphics {
  protocol: GraphicsProtocol
  payload: string
  /** When protocol is none, consumers should use cell/ASCII fallback */
  fallback: boolean
}

/**
 * Encode image using best protocol for capabilities, or mark cell fallback.
 */
export function encodeGraphics(
  caps: TerminalCapabilities,
  image: ImageEncodeInput
): EncodedGraphics {
  const protocol = selectGraphicsProtocol(caps)
  const channels = image.channels ?? (image.format === 'rgba' ? 4 : image.format === 'gray' ? 1 : 3)
  const data =
    image.data instanceof Uint8Array
      ? image.data
      : Buffer.isBuffer(image.data)
        ? image.data
        : Uint8Array.from(image.data)

  switch (protocol) {
    case 'kitty': {
      const fmt = image.format === 'png' ? 'png' : channels === 4 ? 'rgba' : 'rgb'
      return {
        protocol: 'kitty',
        payload: encodeKittyImage(data, image.width, image.height, fmt),
        fallback: false,
      }
    }
    case 'iterm2':
      return {
        protocol: 'iterm2',
        payload: encodeITermImage(data, { name: image.name }),
        fallback: false,
      }
    case 'sixel': {
      const ch: 1 | 3 = channels === 1 ? 1 : 3
      return {
        protocol: 'sixel',
        payload: encodeSixel(data, image.width, image.height, ch),
        fallback: false,
      }
    }
    default:
      return { protocol: 'none', payload: '', fallback: true }
  }
}

/**
 * Decode a graphics payload when protocol is known or auto-detected.
 */
export function decodeGraphics(
  payload: string,
  protocol?: GraphicsProtocol
): { protocol: GraphicsProtocol; data: unknown } {
  const p =
    protocol && protocol !== 'none'
      ? protocol
      : isKittyPayload(payload)
        ? 'kitty'
        : isITermPayload(payload)
          ? 'iterm2'
          : isSixelPayload(payload)
            ? 'sixel'
            : 'none'

  switch (p) {
    case 'kitty':
      return { protocol: 'kitty', data: decodeKittyImage(payload) }
    case 'iterm2':
      return { protocol: 'iterm2', data: decodeITermImage(payload) }
    case 'sixel':
      return { protocol: 'sixel', data: decodeSixel(payload) }
    default:
      throw new Error('graphics: unknown or unsupported payload')
  }
}

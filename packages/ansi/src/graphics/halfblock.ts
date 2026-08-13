/** Truecolor half-block framebuffer. Two pixels per cell (▀). */

export function rgbToHalfBlock(pixels: Uint8Array, width: number, height: number): string {
  const lines: string[] = []
  const rowStride = width * 3
  for (let y = 0; y < height; y += 2) {
    let line = ''
    const y2 = y + 1
    for (let x = 0; x < width; x++) {
      const top = (y * width + x) * 3
      const bot = y2 < height ? (y2 * width + x) * 3 : top
      const tr = pixels[top] ?? 0
      const tg = pixels[top + 1] ?? 0
      const tb = pixels[top + 2] ?? 0
      const br = pixels[bot] ?? 0
      const bg = pixels[bot + 1] ?? 0
      const bb = pixels[bot + 2] ?? 0
      line += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀`
    }
    lines.push(`${line}\x1b[0m`)
    void rowStride
  }
  return lines.join('\n')
}

/**
 * Wave Text Effects - Terminal UI wave text animation utilities
 *
 * Provides wave text effects for terminal UI applications.
 */

/**
 * Create a wave text effect
 *
 * Makes text appear to wave by varying character positions.
 *
 * @param text - Text to wave
 * @param phase - Animation phase (0-1)
 * @param amplitude - Wave amplitude
 * @returns Array of lines with waving text
 */
export const createWaveText = (text: string, phase: number, amplitude: number = 2): string[] => {
  const lines: string[] = Array(amplitude * 2 + 1).fill('')

  text.split('').forEach((char, i) => {
    const offset = Math.sin((i / text.length + phase) * Math.PI * 2) * amplitude
    const yPos = Math.floor(amplitude + offset)

    if (!lines[yPos]) lines[yPos] = ' '.repeat(i)
    lines[yPos] += char
  })

  return lines.filter(line => line.trim())
}

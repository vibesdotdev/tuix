/**
 * Terminal color profile enumeration
 */
export enum ColorProfile {
  NoColor,
  ANSI,
  ANSI256,
  TrueColor,
}

/**
 * Detect terminal color profile from environment
 */
export const detectColorProfile = (): ColorProfile => {
  // Check common environment variables
  const colorterm = process.env.COLORTERM
  if (colorterm === 'truecolor' || colorterm === '24bit') {
    return ColorProfile.TrueColor
  }

  const term = process.env.TERM ?? ''
  if (term.includes('256color')) {
    return ColorProfile.ANSI256
  }

  if (term === 'dumb' || process.env.NO_COLOR) {
    return ColorProfile.NoColor
  }

  return ColorProfile.ANSI
}

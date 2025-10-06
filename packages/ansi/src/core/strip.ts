const PATTERN = /\u001b\[[0-?]*[ -\/]*[@-~]/g

const createMatcher = (): RegExp => new RegExp(PATTERN.source, 'g')

export const stripAnsi = (input: string): string => input.replace(createMatcher(), '')

export const hasAnsi = (input: string): boolean => createMatcher().test(input)

export const countAnsi = (input: string): number => input.match(createMatcher())?.length ?? 0

export const extractAnsi = (input: string): readonly string[] => input.match(createMatcher()) ?? []

export const splitAnsiSegments = (
  input: string
): ReadonlyArray<{ text: string; codes: readonly string[] }> => {
  if (!input) {
    return []
  }

  const matcher = createMatcher()
  const segments: Array<{ text: string; codes: string[] }> = []

  let lastIndex = 0
  let activeCodes: string[] = []

  for (const match of input.matchAll(matcher)) {
    const index = match.index ?? 0

    if (index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, index), codes: [...activeCodes] })
    }

    const code = match[0] ?? ''
    if (code === '\u001b[0m') {
      activeCodes = []
    } else {
      activeCodes = [...activeCodes, code]
    }

    lastIndex = index + code.length
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex), codes: [...activeCodes] })
  }

  return segments
}

import { error } from '@sveltejs/kit'
import { getPattern, patterns } from '$lib/content/patterns'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const pattern = getPattern(params.slug)
  if (!pattern) error(404, 'Pattern not found')
  const index = patterns.findIndex(p => p.slug === pattern.slug)
  const prev = index > 0 ? patterns[index - 1] : null
  const next = index >= 0 && index < patterns.length - 1 ? patterns[index + 1] : null
  return { pattern, prev, next }
}

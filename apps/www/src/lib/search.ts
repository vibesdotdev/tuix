/**
 * Client-side search index over all site content.
 * Entries are flat; the search page filters them locally — no backend.
 */

import { docPages } from './content/docs'
import { packageDocs } from './content/packages'
import { tutorials } from './content/tutorials'
import { patterns } from './content/patterns'
import { componentDocs } from './content/components'
import { featureDocs } from './content/features'

export interface SearchEntry {
  title: string
  /** Lowercased haystack: title + summary/body keywords. */
  haystack: string
  href: string
  section: string
  blurb: string
}

function entry(
  section: string,
  title: string,
  href: string,
  blurb: string,
  extra = ''
): SearchEntry {
  const text = `${title} ${blurb} ${extra}`
  return {
    title,
    href,
    section,
    blurb,
    haystack: text.toLowerCase(),
  }
}

export const searchIndex: SearchEntry[] = [
  ...Object.values(docPages).map(doc =>
    entry(
      'Guide',
      doc.title,
      `/docs/${doc.slug}`,
      doc.description,
      doc.sections.map(s => `${s.heading} ${s.body}`).join(' ')
    )
  ),
  ...packageDocs.map(pkg =>
    entry('Package', `@tuix/${pkg.slug}`, `/packages/${pkg.slug}`, pkg.summary)
  ),
  ...tutorials.map(tutorial =>
    entry('Tutorial', tutorial.title, `/docs/tutorials/${tutorial.slug}`, tutorial.summary)
  ),
  ...patterns.map(pattern =>
    entry('Pattern', pattern.title, `/docs/patterns/${pattern.slug}`, pattern.summary)
  ),
  ...componentDocs.map(component =>
    entry('Component', component.name, `/docs/components/${component.slug}`, component.summary)
  ),
  ...featureDocs.map(feature =>
    entry('Feature', feature.title, `/docs/features/${feature.slug}`, feature.summary)
  ),
  entry('Guide', 'Search', '/search', 'Search every guide, tutorial, package, and component.'),
]

/** Score an entry against a query; 0 means no match. */
export function scoreEntry(entry: SearchEntry, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const terms = q.split(/\s+/).filter(Boolean)

  let score = 0
  for (const term of terms) {
    const inTitle = entry.title.toLowerCase().includes(term)
    const inBody = entry.haystack.includes(term)
    if (!inTitle && !inBody) return 0
    score += inTitle ? 3 : 1
  }
  return score
}

export function searchSite(query: string, limit = 24): SearchEntry[] {
  return searchIndex
    .map(item => ({ item, score: scoreEntry(item, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.item)
}

import { error } from '@sveltejs/kit'
import { componentDocs, getComponent } from '$lib/content/components'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const component = getComponent(params.slug)
  if (!component) error(404, 'Component not found')
  const index = componentDocs.findIndex((c) => c.slug === component.slug)
  const prev = index > 0 ? componentDocs[index - 1] : null
  const next = index >= 0 && index < componentDocs.length - 1 ? componentDocs[index + 1] : null
  return { component, prev, next }
}

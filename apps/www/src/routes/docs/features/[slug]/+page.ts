import { error } from '@sveltejs/kit'
import { featureDocs, getFeature } from '$lib/content/features'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const feature = getFeature(params.slug)
  if (!feature) error(404, 'Feature not found')
  const index = featureDocs.findIndex(f => f.slug === feature.slug)
  const prev = index > 0 ? featureDocs[index - 1] : null
  const next = index >= 0 && index < featureDocs.length - 1 ? featureDocs[index + 1] : null
  return { feature, prev, next }
}

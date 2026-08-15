import { error } from '@sveltejs/kit'
import { getPackage, packageDocs } from '$lib/content/packages'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const pkg = getPackage(params.slug)
  if (!pkg) error(404, 'Package not found')
  const index = packageDocs.findIndex(p => p.slug === pkg.slug)
  const prev = index > 0 ? packageDocs[index - 1] : null
  const next = index >= 0 && index < packageDocs.length - 1 ? packageDocs[index + 1] : null
  return { pkg, prev, next }
}

import { error } from '@sveltejs/kit'
import { getDoc } from '$lib/content/docs'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const doc = getDoc(params.slug)
  if (!doc) error(404, 'Document not found')
  return { doc }
}

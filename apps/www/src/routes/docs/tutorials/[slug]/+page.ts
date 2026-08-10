import { error } from '@sveltejs/kit'
import { getTutorial, tutorials } from '$lib/content/tutorials'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  const tutorial = getTutorial(params.slug)
  if (!tutorial) error(404, 'Tutorial not found')
  const index = tutorials.findIndex((t) => t.slug === tutorial.slug)
  const prev = index > 0 ? tutorials[index - 1] : null
  const next =
    tutorial.next
      ? tutorials.find((t) => t.slug === tutorial.next) ?? null
      : index >= 0 && index < tutorials.length - 1
        ? tutorials[index + 1]
        : null
  return { tutorial, prev, next }
}

import { docPages } from '$lib/content/docs'
import { featureDocs as featureCatalog } from '$lib/content/features'
import { packageDocs as packageCatalog } from '$lib/content/packages'
import { tutorials } from '$lib/content/tutorials'
import { patterns } from '$lib/content/patterns'
import { componentDocs as componentCatalog } from '$lib/content/components'

export const prerender = true

const ORIGIN = 'https://tuix.vibes.dev'

export async function GET() {
  const paths: string[] = [
    '/',
    '/features',
    '/get-started',
    '/packages',
    '/docs',
    '/search',
    '/docs/tutorials',
    '/docs/patterns',
    '/docs/components',
    '/docs/features',
    '/docs/coverage',
  ]

  for (const slug of Object.keys(docPages)) {
    paths.push(`/docs/${slug}`)
  }
  for (const pkg of packageCatalog) {
    paths.push(`/packages/${pkg.slug}`)
  }
  for (const tutorial of tutorials) {
    paths.push(`/docs/tutorials/${tutorial.slug}`)
  }
  for (const pattern of patterns) {
    paths.push(`/docs/patterns/${pattern.slug}`)
  }
  for (const component of componentCatalog) {
    paths.push(`/docs/components/${component.slug}`)
  }
  for (const feature of featureCatalog) {
    paths.push(`/docs/features/${feature.slug}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map(
    path =>
      `  <url><loc>${ORIGIN}${path === '/' ? '' : path}</loc><lastmod>${today}</lastmod></url>`
  )
  .join('\n')}
</urlset>
`

  return new Response(body, {
    headers: {
      'content-type': 'application/xml',
    },
  })
}

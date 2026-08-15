import type { FeatureArea, FeatureDoc } from './types'
import data from './ste/features.json'

export const featureDocs: FeatureDoc[] = data.features as FeatureDoc[]
export const featureAreas: FeatureArea[] = data.areas as FeatureArea[]

export const featuresBySlug: Record<string, FeatureDoc> = Object.fromEntries(
  featureDocs.map(f => [f.slug, f])
)

export function getFeature(slug: string): FeatureDoc | undefined {
  return featuresBySlug[slug]
}

export function featureHref(slug: string): string {
  return `/docs/features/${slug}`
}

export const featureNav = featureDocs.map(f => ({
  href: featureHref(f.slug),
  label: f.title,
  area: f.area,
}))

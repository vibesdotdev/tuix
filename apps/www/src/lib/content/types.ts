/** Shared content types for the product docs site. */

export type CodeSample = {
  lang: string
  filename?: string
  code: string
}

export type DocSection = {
  heading: string
  body: string
  code?: string
  lang?: string
  filename?: string
}

export type DocPage = {
  slug: string
  title: string
  description: string
  sections: DocSection[]
}

export type PackageDoc = {
  slug: string
  name: string
  layer: 'Foundation' | 'Runtime' | 'Authoring' | 'Ecosystem' | string
  summary: string
  purpose: string
  whenToUse: string
  mainConcepts: string[]
  keyExports: string[]
  example?: CodeSample
  related: string[]
}

export type FeatureDoc = {
  id: string
  slug: string
  title: string
  area: string
  packages: string[]
  summary: string
  whatItDoes: string
  howToUse: string
  subfeatures: string[]
  example?: CodeSample
  status: string
}

export type FeatureArea = {
  slug: string
  title: string
  summary: string
  featureSlugs: string[]
}

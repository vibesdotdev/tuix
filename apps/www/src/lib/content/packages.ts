import type { PackageDoc } from './types'
import foundation from './ste/packages-foundation.json'
import runtime from './ste/packages-runtime.json'
import authoring from './ste/packages-authoring.json'
import ecosystem from './ste/packages-ecosystem.json'

const layerOrder = ['Foundation', 'Runtime', 'Authoring', 'Ecosystem'] as const

export const packageDocs: PackageDoc[] = [
  ...foundation.packages,
  ...runtime.packages,
  ...authoring.packages,
  ...ecosystem.packages,
] as PackageDoc[]

export const packagesBySlug: Record<string, PackageDoc> = Object.fromEntries(
  packageDocs.map(p => [p.slug, p])
)

export function getPackage(slug: string): PackageDoc | undefined {
  return packagesBySlug[slug]
}

export function packageHref(nameOrSlug: string): string {
  const slug = nameOrSlug.startsWith('@tuix/') ? nameOrSlug.slice('@tuix/'.length) : nameOrSlug
  return `/packages/${slug}`
}

export function packagesByLayer(): Array<{ layer: string; packages: PackageDoc[] }> {
  const groups = new Map<string, PackageDoc[]>()
  for (const pkg of packageDocs) {
    const list = groups.get(pkg.layer) ?? []
    list.push(pkg)
    groups.set(pkg.layer, list)
  }
  const ordered = layerOrder
    .filter(layer => groups.has(layer))
    .map(layer => ({ layer, packages: groups.get(layer)! }))
  for (const [layer, packages] of groups) {
    if (!layerOrder.includes(layer as (typeof layerOrder)[number])) {
      ordered.push({ layer, packages })
    }
  }
  return ordered
}

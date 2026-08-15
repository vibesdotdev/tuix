import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki'

const LANGS = [
  'typescript',
  'tsx',
  'javascript',
  'jsx',
  'bash',
  'shell',
  'json',
  'markdown',
  'text',
  'diff',
  'toml',
  'yaml',
] as const satisfies readonly BundledLanguage[]

export type CodeLang = (typeof LANGS)[number] | string

let highlighter: Highlighter | null = null
let loading: Promise<Highlighter> | null = null

async function getHighlighter(): Promise<Highlighter> {
  if (highlighter) return highlighter
  if (!loading) {
    loading = createHighlighter({
      themes: ['github-dark-default'],
      langs: [...LANGS],
    }).then(h => {
      highlighter = h
      return h
    })
  }
  return loading
}

function normalizeLang(lang: string): BundledLanguage {
  const map: Record<string, BundledLanguage> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    bash: 'bash',
    md: 'markdown',
    yml: 'yaml',
    plain: 'text',
    txt: 'text',
  }
  const key = lang.toLowerCase().trim()
  return (map[key] ?? (LANGS.includes(key as BundledLanguage) ? key : 'text')) as BundledLanguage
}

/** Infer language from a short label or file-ish filename. */
export function inferLang(label?: string): CodeLang {
  if (!label) return 'typescript'
  const lower = label.toLowerCase()
  if (lower.includes('bash') || lower.startsWith('$') || lower.includes('shell')) return 'bash'
  if (lower.endsWith('.tsx') || lower === 'tsx') return 'tsx'
  if (lower.endsWith('.ts') || lower === 'ts' || lower === 'typescript') return 'typescript'
  if (lower.endsWith('.json')) return 'json'
  if (lower.endsWith('.md')) return 'markdown'
  if (lower.endsWith('.toml')) return 'toml'
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml'
  return normalizeLang(label)
}

export async function highlightCode(code: string, lang: CodeLang = 'typescript'): Promise<string> {
  const h = await getHighlighter()
  const resolved = normalizeLang(String(lang))
  try {
    return h.codeToHtml(code.replace(/\n$/, ''), {
      lang: resolved,
      theme: 'github-dark-default',
    })
  } catch {
    return h.codeToHtml(code.replace(/\n$/, ''), {
      lang: 'text',
      theme: 'github-dark-default',
    })
  }
}

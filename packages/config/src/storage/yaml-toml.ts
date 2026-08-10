/**
 * Pure YAML / TOML helpers for config files (no external deps).
 * Covers maps, nested maps, lists, scalars used by app config.
 */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

/** Parse a scalar token (unquoted). */
function parseScalar(raw: string): unknown {
  const s = raw.trim()
  if (s === '' || s === '~' || s === 'null') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+$/.test(s)) return Number(s)
  if (/^-?\d+\.\d+$/.test(s)) return Number(s)
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  // strip inline comments for unquoted
  const hash = s.indexOf(' #')
  if (hash >= 0) return parseScalar(s.slice(0, hash))
  return s
}

/**
 * Minimal YAML parse for config objects.
 */
export function parseYamlValue(content: string): Record<string, unknown> {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const root: Record<string, unknown> = {}
  type Frame = { indent: number; container: Record<string, unknown> | unknown[] }
  const stack: Frame[] = [{ indent: -1, container: root }]

  const current = (): Frame => stack[stack.length - 1]!

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    if (!line.trim() || line.trim().startsWith('#')) continue

    const indent = line.match(/^ */)?.[0].length ?? 0
    const trimmed = line.trim()

    while (stack.length > 1 && indent <= current().indent) {
      stack.pop()
    }

    const frame = current()

    if (trimmed.startsWith('- ')) {
      const itemRaw = trimmed.slice(2).trim()
      let arr: unknown[]
      if (Array.isArray(frame.container)) {
        arr = frame.container
      } else {
        // should not happen if structure is valid
        arr = []
        ;(frame.container as Record<string, unknown>)['_list'] = arr
      }
      if (itemRaw.includes(':') && !itemRaw.startsWith('"')) {
        const obj: Record<string, unknown> = {}
        const [k, ...rest] = itemRaw.split(':')
        obj[k!.trim()] = parseScalar(rest.join(':'))
        arr.push(obj)
        stack.push({ indent, container: obj })
      } else {
        arr.push(parseScalar(itemRaw))
      }
      continue
    }

    const colon = trimmed.indexOf(':')
    if (colon < 0) continue
    const key = trimmed.slice(0, colon).trim()
    const rest = trimmed.slice(colon + 1).trim()

    if (!isPlainObject(frame.container)) continue
    const obj = frame.container

    if (rest === '' || rest === '|' || rest === '>') {
      // Look ahead for nested block or list
      const next = lines[i + 1]
      const nextIndent = next?.match(/^ */)?.[0].length ?? 0
      if (next?.trim().startsWith('- ') && nextIndent > indent) {
        const arr: unknown[] = []
        obj[key] = arr
        stack.push({ indent, container: arr })
      } else {
        const nested: Record<string, unknown> = {}
        obj[key] = nested
        stack.push({ indent, container: nested })
      }
    } else {
      obj[key] = parseScalar(rest)
    }
  }

  return root
}

/**
 * Serialize a plain object to simple YAML.
 */
export function serializeYamlValue(data: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  if (data == null) return 'null'
  if (typeof data === 'boolean' || typeof data === 'number') return String(data)
  if (typeof data === 'string') {
    if (/[:#\n\[\]{}]/.test(data) || data.trim() !== data) {
      return JSON.stringify(data)
    }
    return data
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return '[]'
    return data
      .map(item => {
        if (isPlainObject(item) || Array.isArray(item)) {
          const body = serializeYamlValue(item, indent + 1)
          return `${pad}- ${body.trimStart()}`
        }
        return `${pad}- ${serializeYamlValue(item, 0)}`
      })
      .join('\n')
  }
  if (isPlainObject(data)) {
    const keys = Object.keys(data)
    if (keys.length === 0) return '{}'
    return keys
      .map(k => {
        const v = data[k]
        if (isPlainObject(v) || Array.isArray(v)) {
          const nested = serializeYamlValue(v, indent + 1)
          return `${pad}${k}:\n${nested}`
        }
        return `${pad}${k}: ${serializeYamlValue(v, 0)}`
      })
      .join('\n')
  }
  return JSON.stringify(data)
}

/**
 * Minimal TOML parse for flat and one-level [tables].
 */
export function parseTomlValue(content: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  let current: Record<string, unknown> = root

  for (const rawLine of content.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const table = line.match(/^\[([^\]]+)\]$/)
    if (table) {
      const path = table[1]!.split('.').map(s => s.trim())
      let node: Record<string, unknown> = root
      for (const p of path) {
        if (!isPlainObject(node[p])) node[p] = {}
        node = node[p] as Record<string, unknown>
      }
      current = node
      continue
    }

    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    // strip comment
    if (!val.startsWith('"') && !val.startsWith("'")) {
      const c = val.indexOf('#')
      if (c >= 0) val = val.slice(0, c).trim()
    }

    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim()
      if (!inner) {
        current[key] = []
      } else {
        current[key] = inner.split(',').map(s => parseScalar(s.trim()))
      }
    } else {
      current[key] = parseScalar(val)
    }
  }

  return root
}

/**
 * Serialize plain object to TOML (nested objects → [tables]).
 */
export function serializeTomlValue(data: Record<string, unknown>, tablePath = ''): string {
  const lines: string[] = []
  const nested: Array<[string, Record<string, unknown>]> = []

  for (const [k, v] of Object.entries(data)) {
    if (isPlainObject(v)) {
      nested.push([tablePath ? `${tablePath}.${k}` : k, v as Record<string, unknown>])
    } else if (Array.isArray(v)) {
      const items = v.map(item => {
        if (typeof item === 'string') return JSON.stringify(item)
        return String(item)
      })
      lines.push(`${k} = [${items.join(', ')}]`)
    } else if (typeof v === 'string') {
      lines.push(`${k} = ${JSON.stringify(v)}`)
    } else if (v == null) {
      lines.push(`${k} = ""`)
    } else {
      lines.push(`${k} = ${String(v)}`)
    }
  }

  let out = lines.join('\n')
  for (const [path, obj] of nested) {
    if (out && !out.endsWith('\n')) out += '\n'
    out += `\n[${path}]\n`
    out += serializeTomlValue(obj, path)
  }
  return out.trim() + '\n'
}

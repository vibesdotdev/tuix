/** @jsxImportSource @tuix/jsx */

export interface FileTreeNode {
  id: string
  name: string
  children?: FileTreeNode[]
}

export interface FileTreeProps {
  nodes: FileTreeNode[]
  selected?: string
  expanded?: string[]
  onSelect?: (id: string) => void
  onToggle?: (id: string) => void
  className?: string
}

function isExpanded(id: string, expanded: string[] | undefined): boolean {
  return expanded === undefined ? true : expanded.includes(id)
}

function walk(
  nodes: FileTreeNode[],
  selected: string | undefined,
  expanded: string[] | undefined,
  prefix: string,
  onSelect?: (id: string) => void,
  onToggle?: (id: string) => void
): JSX.Element[] {
  return nodes.flatMap((node, index) => {
    const last = index === nodes.length - 1
    const branch = last ? '└── ' : '├── '
    const hasKids = Boolean(node.children && node.children.length > 0)
    const open = hasKids && isExpanded(node.id, expanded)
    const glyph = hasKids ? (open ? '▾ ' : '▸ ') : ''
    const cursor = node.id === selected ? '> ' : '  '
    const line = `${prefix}${cursor}${branch}${glyph}${node.name}`
    const handle = () => {
      if (hasKids && onToggle) onToggle(node.id)
      else onSelect?.(node.id)
    }
    const row = (
      <interactive key={node.id} focusable onClick={handle} onKeyPress={key => key === 'Enter' && handle()}>
        <text>{line}</text>
      </interactive>
    )
    if (!hasKids || !open || !node.children) return [row]
    const nextPrefix = `${prefix}${last ? '    ' : '│   '}`
    return [row, ...walk(node.children, selected, expanded, nextPrefix, onSelect, onToggle)]
  })
}

/**
 * Hierarchical list. Owns display + selection, not the filesystem.
 *
 * @example
 * ```tsx
 * <FileTree nodes={tree} selected={path} onSelect={setPath} />
 * ```
 */
export function FileTree(props: FileTreeProps): JSX.Element {
  const rows = walk(
    props.nodes,
    props.selected,
    props.expanded,
    '',
    props.onSelect,
    props.onToggle
  )
  return <vstack className={props.className}>{rows}</vstack>
}

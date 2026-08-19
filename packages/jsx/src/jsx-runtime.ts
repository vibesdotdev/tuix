/**
 * JSX Runtime for CLI-KIT
 *
 * Enables JSX/TSX syntax for building terminal UIs
 * Uses React JSX transform with Svelte-inspired binding support
 */

import type { View } from '@tuix/core/types'
import { markOverlay } from '@tuix/core/types'
import {
  text,
  vstack,
  hstack,
  styledText,
  isView,
  flexbox,
  styledBox,
  spacer as layoutSpacer,
  FlexDirection,
  JustifyContent,
  AlignItems,
  FlexWrap,
  fillView,
  type FlexboxProps,
  type FlexItem,
  type SizeValue,
} from '@tuix/view'
import { style, Style, color, border, type StyleProps } from '@tuix/ansi'
import {
  isBindableRune,
  isStateRune,
  isRune,
  getGlobalEventBus,
  registerFocusable,
  isFocused,
  setFocusedId,
  getFocusedId,
  type BindableRune,
  type StateRune,
} from '@tuix/reactive'
import { scopeManager } from './scope/manager'
import { Scope, ScopeContent, ScopeFallback } from './scope/components'
import type { ScopeContext, ScopeDef } from './scope/types'
import { Effect } from 'effect'
import { getGlobalRegistry } from '@tuix/core'
import type { JSXPluginEvent, JSXCommandEvent } from '@tuix/jsx/events'
import { pluginStore } from './plugins'

const debug = (...args: unknown[]) => {
  if (process.env.TUIX_DEBUG === '1') console.debug('[jsx]', ...args)
}

// =============================================================================
// JSX Element Types
// =============================================================================

/**
 * JSX Element - the object returned by jsx() function calls
 * This represents a JSX element before it's rendered to a View
 */
export interface JSXElement {
  /** Internal marker to identify Tuix JSX descriptors */
  $$typeof: symbol
  /** Element type - either a string (intrinsic) or function (component) */
  type: string | Function
  /** Element props */
  props: Record<string, any>
  /** Element key for list reconciliation */
  key: string | number | null
  /** Optional ref for imperative handles */
  ref?: unknown
  /** Development metadata (source location) */
  __source?: {
    fileName: string
    lineNumber: number
    columnNumber: number
  }
  /** Development metadata (self reference) */
  __self?: unknown
}

/**
 * JSX Node - valid return types from JSX expressions
 */
export type JSXNode = JSXElement | string | number | boolean | null | undefined | JSXNode[]

const JSX_ELEMENT_TYPE = Symbol.for('tuix.jsx.element')

function isJSXElement(value: unknown): value is JSXElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).$$typeof === JSX_ELEMENT_TYPE
  )
}

type DevInfo = {
  source?: {
    fileName: string
    lineNumber: number
    columnNumber: number
  }
  self?: unknown
}

const RESERVED_PROPS = new Set(['key', 'ref', '__self', '__source', 'children'])

const normalizeKey = (value: unknown): string | number | null => {
  if (value == null || typeof value === 'boolean') {
    return null
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }
  return String(value)
}

const appendChild = (target: unknown[], value: unknown) => {
  if (value === undefined) return
  target.push(value)
}

const createJSXElement = (
  type: string | Function,
  rawProps: Record<string, unknown> | null | undefined,
  keyOverride: unknown,
  additionalChildren: unknown[],
  devInfo?: DevInfo
): JSXElement => {
  const props: Record<string, unknown> = {}
  let key: string | number | null = null
  let ref: unknown = undefined
  const children: unknown[] = []
  const info: DevInfo = devInfo ?? {}

  if (rawProps != null) {
    for (const propName of Object.keys(rawProps)) {
      const value = (rawProps as Record<string, unknown>)[propName]

      if (propName === 'key') {
        const normalized = normalizeKey(value)
        if (normalized !== null) {
          key = normalized
        }
        continue
      }

      if (propName === 'ref') {
        ref = value
        continue
      }

      if (propName === 'children') {
        appendChild(children, value)
        continue
      }

      if (propName === '__source') {
        if (value && typeof value === 'object') {
          info.source = value as DevInfo['source']
        }
        continue
      }

      if (propName === '__self') {
        info.self = value
        continue
      }

      if (!RESERVED_PROPS.has(propName)) {
        props[propName] = value
      }
    }
  }

  if (keyOverride !== undefined && keyOverride !== null) {
    const normalized = normalizeKey(keyOverride)
    if (normalized !== null) {
      key = normalized
    }
  }

  if (additionalChildren.length > 0) {
    for (const child of additionalChildren) {
      appendChild(children, child)
    }
  }

  if (children.length === 1) {
    props.children = children[0]
  } else if (children.length > 1) {
    props.children = children
  }

  const element: JSXElement = {
    $$typeof: JSX_ELEMENT_TYPE,
    type,
    props,
    key,
  }

  if (ref !== undefined) {
    ;(element as Record<string, unknown>).ref = ref
  }

  if (info.source) {
    element.__source = info.source
  }

  if (info.self) {
    element.__self = info.self
  }

  return element
}

interface JSXModule {
  emitPluginStart?: (name: string, scope: ScopeContext) => Effect.Effect<unknown, unknown, unknown>
  emitPluginEnd?: (name: string, scope: ScopeContext) => Effect.Effect<unknown, unknown, unknown>
  emitCommandStart?: (path: string[], command: ScopeDef) => Effect.Effect<unknown, unknown, unknown>
  emitCommandEnd?: (
    path: string[],
    command: ScopeDef,
    result?: unknown
  ) => Effect.Effect<unknown, unknown, unknown>
}

interface ConfigManager {
  get?: (key: string, defaultValue?: unknown) => unknown
  set?: (key: string, value: unknown) => unknown
}

// Global plugin registry for JSX components - now uses stores
class JSXPluginRegistry {
  // Keep private fields that aren't replaced by stores
  private declarativePlugins: Map<
    string,
    {
      component: Function
      metadata?: Record<string, unknown>
      registeredAt: Date
    }
  > = new Map()

  // Use the global scope manager
  private scopeManager = scopeManager

  // Track current scope context
  private currentScopeId: string | null = null
  private scopeIdStack: string[] = []

  // JSX Module integration
  private jsxModule: JSXModule | null = null

  // Command context for proper JSX evaluation
  private activeCommand: {
    path: string[] // e.g., ['dev'] or ['dev', 'start']
    args: Record<string, string | number | boolean | undefined>
    flags: Record<string, string | number | boolean | undefined>
  } | null = null

  // Global config manager
  private configManager: ConfigManager | null = null

  constructor() {
    // Initialize JSX module if available
    this.initializeJSXModule()
  }

  private initializeJSXModule() {
    try {
      const registry = getGlobalRegistry()
      this.jsxModule = registry.getModule<JSXModule>('jsx')

      if (this.jsxModule) {
        debug('JSX Module found and initialized')
      }
    } catch (error) {
      debug('JSX Module not available yet:', error)
    }
  }

  // Helper to get current scope
  private getCurrentScope(): ScopeDef | null {
    if (!this.currentScopeId) return null
    return this.scopeManager.getScopeDef(this.currentScopeId)
  }

  // Helper to push scope
  private pushScope(scope: ScopeDef): void {
    if (this.currentScopeId) {
      this.scopeIdStack.push(this.currentScopeId)
    }
    this.currentScopeId = scope.id
    Effect.runSync(this.scopeManager.registerScope(scope))
  }

  // Helper to pop scope
  private popScope(): ScopeDef | null {
    const current = this.getCurrentScope()
    if (this.scopeIdStack.length > 0) {
      this.currentScopeId = this.scopeIdStack.pop()!
    } else {
      this.currentScopeId = null
    }
    return current
  }

  // --- Plugin Store Integration (declarative) ---

  /**
   * Register a declarative plugin component
   * This is for JSX-based plugins, not loaded plugins
   */
  registerDeclarativePlugin(name: string, component: Function, metadata?: Record<string, unknown>) {
    debug('Registering declarative plugin:', name)

    // Store the plugin component
    this.declarativePlugins.set(name, {
      component,
      metadata: metadata || {},
      registeredAt: new Date(),
    })

    // Create and register plugin scope
    const pluginScope: ScopeDef = {
      id: `plugin_${name}_${Date.now()}`,
      type: 'plugin',
      name,
      path: [name],
      description: metadata?.description,
      executable: true,
      metadata,
      children: [],
    }

    this.pushScope(pluginScope)

    // Emit plugin event if JSX module is available
    if (this.jsxModule) {
      Effect.runSync(this.jsxModule.emitPluginStart(name, pluginScope as ScopeContext))
    }

    return name
  }

  /**
   * Unregister a declarative plugin
   */
  unregisterDeclarativePlugin(name: string) {
    debug('Unregistering declarative plugin:', name)

    // Find and remove the plugin scope
    const allScopes = this.scopeManager.getAllScopes()
    const pluginScope = allScopes.find(s => s.type === 'plugin' && s.name === name)

    if (pluginScope) {
      Effect.runSync(this.scopeManager.removeScope(pluginScope.id))
    }

    // Remove from declarative plugins
    this.declarativePlugins.delete(name)

    // Pop scope if it's current
    if (this.currentScopeId === pluginScope?.id) {
      this.popScope()
    }

    // Emit plugin end event
    if (this.jsxModule && pluginScope) {
      Effect.runSync(this.jsxModule.emitPluginEnd(name))
    }
  }

  /**
   * Get a declarative plugin by name
   */
  getDeclarativePlugin(name: string):
    | {
        component: Function
        metadata?: Record<string, unknown>
        registeredAt: Date
      }
    | undefined {
    return this.declarativePlugins.get(name)
  }

  /**
   * List all declarative plugins
   */
  listDeclarativePlugins(): string[] {
    return Array.from(this.declarativePlugins.keys())
  }

  /**
   * Check if a declarative plugin exists
   */
  hasDeclarativePlugin(name: string): boolean {
    return this.declarativePlugins.has(name)
  }

  // --- Plugin Registry Integration (loaded plugins) ---

  /**
   * Register a loaded plugin (from file system)
   */
  registerPlugin(
    name: string,
    plugin: Record<string, unknown>,
    description?: string,
    version?: string
  ) {
    debug('Registering loaded plugin:', name)

    // Use the store to register the plugin
    pluginStore.registerDeclarativePlugin(name, plugin)
    // Note: pluginStore doesn't have enable method, removed for now

    // Create plugin scope
    const pluginScope: ScopeDef = {
      id: `plugin_${name}_${Date.now()}`,
      type: 'plugin',
      name,
      path: [name],
      description,
      metadata: { version, plugin },
      executable: true,
      children: [],
    }

    this.pushScope(pluginScope)

    // Emit plugin start event
    if (this.jsxModule) {
      Effect.runSync(this.jsxModule.emitPluginStart(name, pluginScope as ScopeContext))
    }

    return name
  }

  /**
   * Unregister a loaded plugin
   */
  unregisterPlugin(name: string) {
    debug('Unregistering loaded plugin:', name)

    // Find the plugin scope
    const allScopes = this.scopeManager.getAllScopes()
    const pluginScope = allScopes.find(s => s.type === 'plugin' && s.name === name)

    if (pluginScope) {
      // Pop scope if current
      if (this.currentScopeId === pluginScope.id) {
        this.popScope()
      }

      // Remove scope
      Effect.runSync(this.scopeManager.removeScope(pluginScope.id))
    }

    // Emit plugin end event
    if (this.jsxModule) {
      Effect.runSync(this.jsxModule.emitPluginEnd(name))
    }

    // Disable in store
    pluginStore.disable(name)
  }

  /**
   * Get a loaded plugin
   */
  getPlugin(name: string): Record<string, unknown> | null {
    const plugin = pluginStore.plugins().find(p => p.name === name)
    return plugin?.component || null
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): string[] {
    return pluginStore.plugins().map(p => p.name)
  }

  // --- Command Registration ---

  registerCommand(path: string[], handler: Function, metadata?: Record<string, unknown>) {
    debug('Registering command:', path.join(' '))

    const currentScope = this.getCurrentScope()
    const parentPath = currentScope?.path || []
    const fullPath = [...parentPath, ...path]

    // Create command scope
    const commandScope: ScopeDef = {
      id: `command_${fullPath.join('_')}_${Date.now()}`,
      type: 'command',
      name: path[path.length - 1],
      path: fullPath,
      handler,
      executable: true,
      metadata,
      children: [],
    }

    // Register with scope manager
    Effect.runSync(this.scopeManager.registerScope(commandScope))

    // If current scope exists, add as child
    if (currentScope) {
      currentScope.children.push(commandScope)
    }

    // Emit command event if JSX module is available
    if (this.jsxModule) {
      Effect.runSync(this.jsxModule.emitCommandRegistered(fullPath, commandScope as ScopeContext))
    }

    return fullPath.join(' ')
  }

  unregisterCommand(path: string[]) {
    debug('Unregistering command:', path.join(' '))

    // Find command scope
    const allScopes = this.scopeManager.getAllScopes()
    const commandScope = allScopes.find(
      s =>
        s.type === 'command' &&
        s.path.length === path.length &&
        s.path.every((p, i) => p === path[i])
    )

    if (commandScope) {
      Effect.runSync(this.scopeManager.removeScope(commandScope.id))
    }
  }

  // --- Command Execution ---

  executeCommand(
    path: string[],
    args: Record<string, string | number | boolean | undefined> = {},
    flags: Record<string, string | number | boolean | undefined> = {}
  ) {
    debug('Executing command:', path.join(' '))

    // Find command scope
    const allScopes = this.scopeManager.getAllScopes()
    const commandScope = allScopes.find(
      s =>
        s.type === 'command' &&
        s.path.length === path.length &&
        s.path.every((p, i) => p === path[i])
    )

    if (!commandScope || !commandScope.handler) {
      throw new Error(`Command not found: ${path.join(' ')}`)
    }

    // Execute handler
    return commandScope.handler({ args, flags })
  }

  // --- Context Management ---

  setActiveCommand(
    command: {
      path: string[]
      args: Record<string, string | number | boolean | undefined>
      flags: Record<string, string | number | boolean | undefined>
    } | null
  ) {
    this.activeCommand = command
  }

  getActiveCommand() {
    return this.activeCommand
  }

  // Context management for parent/child relationships
  pushContext(type: 'plugin' | 'command' | 'component', id: string, data: Record<string, unknown>) {
    const scope: ScopeDef = {
      id: `${type}_${id}_${Date.now()}`,
      type,
      name: id,
      path: this.getCurrentScope()?.path ? [...this.getCurrentScope()!.path, id] : [id],
      metadata: data,
      executable: type !== 'component',
      children: [],
    }

    this.pushScope(scope)
    // The original code had this line commented out, but it seems necessary for context tracking
    // this.commandStack.push({ type, id, data })
  }

  popContext() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // const context = this.commandStack.pop()
    const poppedScope = this.popScope()

    // if (context && poppedScope) {
    //   debug(`Popped ${context.type} context:`, context.id)
    // }

    return null // Return null as context is commented out
  }

  getCurrentContext() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return this.commandStack[this.commandStack.length - 1] || null
    return null // Return null as context is commented out
  }

  getContextStack() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return [...this.commandStack]
    return [] // Return empty array as context is commented out
  }

  // Track renderable content for help generation
  pushRenderableContent(content: View | JSX.Element) {
    // The original code had this line commented out, but it seems necessary for context tracking
    // this.renderableContent.push(content)
  }

  popRenderableContent() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return this.renderableContent.pop()
    return null // Return null as renderableContent is commented out
  }

  hasRenderableContent(): boolean {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return this.renderableContent.length > 0
    return false // Return false as renderableContent is commented out
  }

  // Scope-aware state management
  getScopedState<T>(key: string, defaultValue?: T): T | undefined {
    // Look up the scope hierarchy for a state value
    let currentId = this.currentScopeId
    while (currentId) {
      const scope = this.scopeManager.getScopeDef(currentId)
      if (scope?.metadata?.[key] !== undefined) {
        return scope.metadata[key]
      }
      // Move up to parent
      const state = this.scopeManager.getScope(currentId)
      currentId = state?.parentId || null
    }
    return defaultValue
  }

  setScopedState(key: string, value: unknown) {
    const currentScope = this.getCurrentScope()
    if (currentScope) {
      currentScope.metadata = currentScope.metadata || {}
      currentScope.metadata[key] = value
    }
  }

  // Helper to get all plugins in the current scope
  getScopedPlugins(): Record<string, unknown>[] {
    const allScopes = this.scopeManager.getAllScopes()
    return allScopes
      .filter(s => s.type === 'plugin')
      .map(s => s.metadata?.plugin)
      .filter(Boolean)
  }

  // Config management
  setConfigManager(configManager: ConfigManager) {
    this.configManager = configManager
  }

  getConfigManager() {
    return this.configManager
  }

  // Get the scope manager for direct access
  getScopeManager() {
    return this.scopeManager
  }

  // Helper methods for scope access
  getCurrentPlugin(): Record<string, unknown> | null {
    const currentScope = this.getCurrentScope()
    if (currentScope?.type === 'plugin') {
      return currentScope.metadata?.plugin || null
    }

    // Look up the scope hierarchy
    let currentId = this.currentScopeId
    while (currentId) {
      const scope = this.scopeManager.getScopeDef(currentId)
      if (scope?.type === 'plugin') {
        return scope.metadata?.plugin || null
      }
      const state = this.scopeManager.getScope(currentId)
      currentId = state?.parentId || null
    }

    return null
  }

  getCurrentCommand(): ScopeDef | null {
    const currentScope = this.getCurrentScope()
    if (currentScope?.type === 'command') {
      return currentScope
    }

    // Look up the scope hierarchy
    let currentId = this.currentScopeId
    while (currentId) {
      const scope = this.scopeManager.getScopeDef(currentId)
      if (scope?.type === 'command') {
        return scope
      }
      const state = this.scopeManager.getScope(currentId)
      currentId = state?.parentId || null
    }

    return null
  }

  // Debug helpers
  getDebugInfo() {
    return {
      currentScopeId: this.currentScopeId,
      scopeStackDepth: this.scopeIdStack.length,
      // The original code had this line commented out, but it seems necessary for context tracking
      // commandStackDepth: this.commandStack.length,
      renderableContentDepth: 0, // Renderable content is commented out
      declarativePluginsCount: this.declarativePlugins.size,
      totalScopes: this.scopeManager.getAllScopes().length,
    }
  }
}

// Create global registry instance
const registry = new JSXPluginRegistry()

type StyleInstance = ReturnType<typeof style>

const INTERACTIVE_METADATA = Symbol.for('tuix.interactive')

const isStyleInstance = (value: unknown): value is StyleInstance => value instanceof Style

const extractStyleProps = (value: unknown): Partial<StyleProps> | undefined => {
  if (!value) return undefined
  if (isStyleInstance(value)) {
    return { ...value.props }
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.props && typeof record.props === 'object') {
      return { ...(record.props as Partial<StyleProps>) }
    }
    return { ...(record as Partial<StyleProps>) }
  }
  return undefined
}

const mergeStyleProps = (
  ...inputs: Array<Partial<StyleProps> | undefined>
): Partial<StyleProps> | undefined => {
  const filtered = inputs.filter(Boolean) as Partial<StyleProps>[]
  if (filtered.length === 0) return undefined
  return filtered.reduce<Partial<StyleProps>>((acc, current) => ({ ...acc, ...current }), {})
}

const buildStyle = (...inputs: Array<Partial<StyleProps> | undefined>): StyleInstance => {
  const merged = mergeStyleProps(...inputs)
  if (!merged || Object.keys(merged).length === 0) {
    return style()
  }
  return style(merged)
}

const paintCell = (content: string, props: Record<string, unknown>) => {
  const fg = props.fg ?? props.color ?? props.foreground
  const bg = props.bg ?? props.background
  const merged = mergeStyleProps(
    extractStyleProps(props.style),
    fg ? { foreground: fg as never } : undefined,
    bg ? { background: bg as never } : undefined
  )
  if (!merged || Object.keys(merged).length === 0) return text(content)
  return styledText(content, buildStyle(merged))
}

const unwrapProp = (value: unknown): unknown => {
  if (isBindableRune(value) || isStateRune(value)) {
    return value()
  }
  return value
}

const stringProp = (value: unknown, fallback = ''): string => {
  const unwrapped = unwrapProp(value)
  if (unwrapped == null || typeof unwrapped === 'boolean') return fallback
  return String(unwrapped)
}

const toTextContent = (children: unknown[]): string | null => {
  const segments: string[] = []
  for (const child of children) {
    // Skip null, undefined, and booleans (like React does)
    if (child == null || typeof child === 'boolean') continue

    const type = typeof child
    if (type === 'string' || type === 'number' || type === 'bigint') {
      segments.push(String(child))
      continue
    }
    if (type === 'object' && 'toString' in (child as Record<string, unknown>)) {
      const stringValue = (child as Record<string, unknown>).toString?.()
      if (stringValue && stringValue !== '[object Object]') {
        segments.push(stringValue)
        continue
      }
    }
    return null
  }
  return segments.join('')
}

function renderChild(child: unknown): View | null {
  if (child == null || typeof child === 'boolean') {
    return null
  }

  if (isView(child)) {
    return child
  }

  if (Array.isArray(child)) {
    const collected: View[] = []
    for (const nested of child) {
      const view = renderChild(nested)
      if (view) {
        collected.push(view)
      }
    }
    if (collected.length === 0) return null
    if (collected.length === 1) return collected[0]
    return vstack(...collected)
  }

  if (isJSXElement(child)) {
    return renderJSX(child.type, child.props ?? null)
  }

  if (child && typeof child === 'object' && 'render' in (child as Record<string, unknown>)) {
    const candidate = child as View
    if (typeof candidate.render === 'function') {
      return candidate
    }
  }

  const content = toTextContent([child])
  if (content !== null) {
    return text(content)
  }

  return null
}

function ensureViewArray(children: unknown[]): View[] {
  const views: View[] = []
  for (const child of children) {
    const rendered = renderChild(child)
    if (rendered) {
      views.push(rendered)
    }
  }
  return views
}

/** Coerce a width/height prop to a SizeValue: numbers pass through, 'fill'
 * and 'NN%' strings pass through as terminal sizing units, everything else
 * (including booleans/objects) is dropped. */
function toSizeValue(value: unknown): SizeValue | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    if (value === 'fill') return 'fill'
    if (/^\d+(?:\.\d+)?%$/.test(value)) return value as `${number}%`
    const numeric = Number(value)
    if (Number.isFinite(numeric) && value.trim() !== '') return numeric
  }
  return undefined
}

/** Extract rect-filling props (width/height sizes + background) shared by
 * text/vstack/hstack: returns null when none are present. */
function extractFillProps(
  props: Record<string, unknown>
): { width?: SizeValue; height?: SizeValue; background?: string } | null {
  const width = toSizeValue(props.width)
  const height = toSizeValue(props.height)
  const bg = props.bg ?? props.background
  const background = typeof bg === 'string' ? bg : undefined
  if (width === undefined && height === undefined && background === undefined) return null
  return { width, height, background }
}

/** Wrap a view with fill semantics when fill props are present. */
function applyFillProps(view: View, props: Record<string, unknown>): View {
  const fill = extractFillProps(props)
  return fill ? fillView(view, fill) : view
}

/** Render flex children, lifting flex/grow/shrink/basis from element props
 * onto FlexItems — the JSX path into the flexbox grow/shrink algorithm. */
function collectFlexChildren(children: unknown[]): Array<View | FlexItem> {
  const out: Array<View | FlexItem> = []
  for (const child of children) {
    const flexProps = isJSXElement(child)
      ? ((child.props ?? {}) as Record<string, unknown>)
      : (child as Record<string, unknown>)
    const flex = toNumber(flexProps.flex)
    const grow = toNumber(flexProps.grow)
    const shrink = toNumber(flexProps.shrink)
    const basis = toNumber(flexProps.basis)
    const rendered = renderChild(child)
    if (!rendered) continue
    if (flex !== undefined || grow !== undefined || shrink !== undefined || basis !== undefined) {
      out.push({
        view: rendered,
        flex: flex ?? grow,
        grow: grow ?? flex,
        shrink,
        basis: basis !== undefined ? basis : undefined,
      })
    } else {
      out.push(rendered)
    }
  }
  return out
}

const joinViews = (views: View[], gap: number = 1): View => {
  if (views.length === 0) return text('')
  if (views.length === 1) return views[0]
  if (!Number.isFinite(gap) || gap <= 0) {
    return hstack(...views)
  }
  const spacer = text(' '.repeat(gap))
  const withGap: View[] = []
  views.forEach((view, index) => {
    if (index > 0) {
      withGap.push(spacer)
    }
    withGap.push(view)
  })
  return hstack(...withGap)
}

const wrapInteractiveView = (child: View, props: Record<string, unknown>): View => {
  const interactiveView: View & { [INTERACTIVE_METADATA]?: Record<string, unknown> } = {
    render: child.render.bind(child),
    width: child.width,
    height: child.height,
  }

  const events: Record<string, unknown> = {}
  const possibleEvents = [
    'onClick',
    'onFocus',
    'onBlur',
    'onMouseEnter',
    'onMouseLeave',
    'onKeyPress',
    'onSubmit',
    'onChange',
    'onHover',
  ]

  for (const key of possibleEvents) {
    const handler = props[key]
    if (typeof handler === 'function') {
      events[key] = handler
    }
  }

  const disabled = props.disabled === true || props.disabled === 'true'
  const focusable = disabled ? false : props.focusable !== false
  const metadata: Record<string, unknown> = {
    focusable,
    events,
    className: props.className,
    role: props.role,
    tooltip: props.tooltip,
    disabled,
  }

  Object.defineProperty(interactiveView, INTERACTIVE_METADATA, {
    value: metadata,
    enumerable: false,
    writable: false,
  })

  return interactiveView
}

const toNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const normalizePadding = (
  value: unknown
): { top?: number; right?: number; bottom?: number; left?: number } | undefined => {
  if (value == null) return undefined
  if (typeof value === 'number') {
    return { top: value, right: value, bottom: value, left: value }
  }
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>
    const vertical = toNumber(source.vertical)
    const horizontal = toNumber(source.horizontal)
    return {
      top: toNumber(source.top) ?? vertical ?? 0,
      bottom: toNumber(source.bottom) ?? vertical ?? 0,
      left: toNumber(source.left) ?? horizontal ?? 0,
      right: toNumber(source.right) ?? horizontal ?? 0,
    }
  }
  return undefined
}

const resolveBorderPreset = (value: unknown) => {
  if (value === true || value === 'true') return border.thin
  if (!value || value === false || value === 'false' || value === 'none') return undefined

  // If it's already a Border object, return it directly
  if (typeof value === 'object' && value !== null) {
    const borderObj = value as any
    if (
      borderObj.topLeft &&
      borderObj.topRight &&
      borderObj.bottomLeft &&
      borderObj.bottomRight &&
      borderObj.horizontal &&
      borderObj.vertical
    ) {
      return borderObj
    }
  }

  if (typeof value === 'string') {
    const key = value.toLowerCase()
    switch (key) {
      case 'single':
      case 'thin':
        return border.thin
      case 'double':
        return border.double
      case 'rounded':
        return border.rounded
      case 'thick':
        return border.thick
      case 'ascii':
        return border.ascii
      default:
        return undefined
    }
  }
  return undefined
}

const mapFlexDirection = (value: unknown): FlexDirection | undefined => {
  if (typeof value !== 'string') return undefined
  switch (value) {
    case 'column':
      return FlexDirection.Column
    case 'column-reverse':
      return FlexDirection.ColumnReverse
    case 'row-reverse':
      return FlexDirection.RowReverse
    case 'row':
    default:
      return FlexDirection.Row
  }
}

const mapJustifyContent = (value: unknown): JustifyContent | undefined => {
  if (typeof value !== 'string') return undefined
  switch (value) {
    case 'center':
      return JustifyContent.Center
    case 'end':
    case 'flex-end':
      return JustifyContent.End
    case 'between':
    case 'space-between':
      return JustifyContent.SpaceBetween
    case 'around':
    case 'space-around':
      return JustifyContent.SpaceAround
    case 'evenly':
    case 'space-evenly':
      return JustifyContent.SpaceEvenly
    case 'start':
    case 'flex-start':
    default:
      return JustifyContent.Start
  }
}

const mapAlignItems = (value: unknown): AlignItems | undefined => {
  if (typeof value !== 'string') return undefined
  switch (value) {
    case 'center':
      return AlignItems.Center
    case 'end':
    case 'flex-end':
      return AlignItems.End
    case 'stretch':
      return AlignItems.Stretch
    case 'baseline':
      return AlignItems.Baseline
    case 'start':
    case 'flex-start':
    default:
      return AlignItems.Start
  }
}

const mapFlexWrap = (value: unknown): FlexWrap | undefined => {
  if (value === true || value === 'wrap') return FlexWrap.Wrap
  if (value === 'reverse' || value === 'wrap-reverse') return FlexWrap.WrapReverse
  if (value === false || value === 'nowrap' || value == null) return FlexWrap.NoWrap
  return FlexWrap.NoWrap
}

const headingPresetStyles: Record<number, Partial<StyleProps>> = {
  1: { bold: true, underline: true, foreground: color.white },
  2: { bold: true, foreground: color.white },
  3: { bold: true, foreground: color.gray },
  4: { bold: true },
  5: { foreground: color.gray },
  6: { faint: true, foreground: color.gray },
}

const SPINNER_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  circle: ['◐', '◓', '◑', '◒'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  pulse: ['·', '•', '●', '•'],
  wave: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
} as const

const BUTTON_VARIANTS: Record<string, Partial<StyleProps>> = {
  primary: {
    background: color.blue,
    foreground: color.white,
    borderForeground: color.blue,
  },
  secondary: {
    background: color.gray,
    foreground: color.white,
    borderForeground: color.gray,
  },
  success: {
    background: color.green,
    foreground: color.black,
    borderForeground: color.green,
  },
  danger: {
    background: color.red,
    foreground: color.white,
    borderForeground: color.red,
  },
  warning: {
    background: color.yellow,
    foreground: color.black,
    borderForeground: color.yellow,
  },
  ghost: {
    background: undefined,
    foreground: color.white,
    borderForeground: color.gray,
  },
}

const BUTTON_SIZE_PADDING: Record<string, { vertical: number; horizontal: number }> = {
  small: { vertical: 0, horizontal: 1 },
  medium: { vertical: 1, horizontal: 2 },
  large: { vertical: 2, horizontal: 3 },
}

const DEFAULT_BORDER = 'rounded'

const CHECKBOX_MARKS = {
  checked: '☑',
  unchecked: '☐',
}

const TOGGLE_MARKS = {
  on: '●',
  off: '○',
}

/**
 * JSX factory function for creating terminal UI elements
 *
 * This is the core JSX runtime factory that transforms JSX syntax into View objects.
 * Supports both intrinsic elements (like 'text', 'vstack') and function components.
 *
 * @param type - The element type (string for intrinsics, function for components)
 * @param props - Element properties/attributes object
 * @param children - Child elements (can be Views, strings, or arrays)
 * @returns A View object that can be rendered to the terminal
 *
 * @example
 * ```tsx
 * // Intrinsic element
 * const textElement = jsx('text', {
 *   style: { color: 'red' },
 *   children: 'Hello World',
 * })
 *
 * // Function component
 * const MyComponent = ({ name }: { name: string }) =>
 *   jsx('text', { children: `Hello ${name}` })
 * const componentElement = jsx(MyComponent, { name: 'Drew' })
 * ```
 *
 * @throws Error if the element type is unknown and cannot be converted to a text node
 */
// Export component registrations
/**
 * Internal rendering function - converts JSX to Views
 * This is the actual implementation that does all the work
 */
function renderJSX(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): View {
  debug('[JSX] Creating element:', type, {
    props: props ? Object.keys(props) : null,
    key: props?.key,
  })

  // Handle null/undefined props
  const safeProps = props || {}

  const hiddenValue = (safeProps as Record<string, unknown>).hidden
  if (hiddenValue === true || hiddenValue === 'true') {
    return text('')
  }

  // Handle children - can be passed as props.children or as rest args
  const allChildren = safeProps.children
    ? Array.isArray(safeProps.children)
      ? safeProps.children
      : [safeProps.children]
    : children

  // Filter out null/undefined children and flatten
  const validChildren = allChildren.flat(Infinity).filter(child => child != null)

  // Handle function components
  if (typeof type === 'function') {
    debug('[RUNTIME] Calling function component:', type.name || 'Anonymous')
    const componentProps = { ...safeProps, children: validChildren }
    const result = type(componentProps)
    debug('[RUNTIME] Function component returned:', typeof result)

    if (result == null || typeof result === 'boolean') {
      return text('')
    }

    if (isView(result)) {
      return result
    }

    if (isJSXElement(result)) {
      debug('[RUNTIME] Recursively rendering JSXElement from component')
      return renderJSX(result.type, result.props ?? null)
    }

    if (Array.isArray(result)) {
      const renderedArray = ensureViewArray(result)
      if (renderedArray.length === 0) {
        return text('')
      }
      return renderedArray.length === 1 ? renderedArray[0] : vstack(...renderedArray)
    }

    if (result && typeof result === 'object' && 'render' in (result as Record<string, unknown>)) {
      const candidate = result as View
      if (typeof candidate.render === 'function') {
        return candidate
      }
    }

    const rendered = renderChild(result)
    if (rendered) {
      return rendered
    }

    return text(String(result))
  }

  // Handle built-in JSX intrinsics
  switch (type) {
    case 'text': {
      const textContent = toTextContent(validChildren)
      if (textContent !== null) {
        return applyFillProps(paintCell(textContent, safeProps), safeProps)
      }
      const views = ensureViewArray(validChildren)
      const stacked = views.length === 1 ? views[0]! : vstack(...views)
      return applyFillProps(stacked, safeProps)
    }

    case 'styled-text':
    case 'styledText': {
      const textContent = toTextContent(validChildren) ?? ''
      const styleProps = mergeStyleProps(extractStyleProps(safeProps.style))
      return styledText(textContent, buildStyle(styleProps))
    }

    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(safeProps.level) || 1))
      const baseStyle = headingPresetStyles[level] ?? headingPresetStyles[1]
      const styleProps = mergeStyleProps(baseStyle, extractStyleProps(safeProps.style))
      const textContent = toTextContent(validChildren)
      if (textContent !== null) {
        return styledText(textContent, buildStyle(styleProps))
      }
      const views = ensureViewArray(validChildren)
      return views.length === 1 ? views[0] : vstack(...views)
    }

    case 'code': {
      const base = {
        foreground: color.green,
        background: color.black,
      } satisfies Partial<StyleProps>
      const styleProps = mergeStyleProps(base, extractStyleProps(safeProps.style))
      const textContent = toTextContent(validChildren) ?? ''
      return styledText(textContent, buildStyle(styleProps))
    }

    case 'icon': {
      const glyph = typeof safeProps.glyph === 'string' ? safeProps.glyph : undefined
      const textContent = glyph ?? toTextContent(validChildren) ?? ''
      const styleProps = extractStyleProps(safeProps.style)
      return styledText(textContent, buildStyle(styleProps))
    }

    case 'box': {
      const childrenViews = ensureViewArray(validChildren)
      const padding = normalizePadding(safeProps.padding)
      const resolvedStyle = extractStyleProps(safeProps.style)
      const styleInputs: Array<Partial<StyleProps> | undefined> = [resolvedStyle]
      if (safeProps.background) {
        styleInputs.push({ background: safeProps.background as any })
      }
      if ((safeProps as Record<string, unknown>).borderColor) {
        styleInputs.push({
          borderForeground: (safeProps as Record<string, unknown>).borderColor as any,
        })
      }
      if ((safeProps as Record<string, unknown>).borderBackground) {
        styleInputs.push({
          borderBackground: (safeProps as Record<string, unknown>).borderBackground as any,
        })
      }
      const width = toNumber(safeProps.width)
      if (typeof width === 'number') {
        styleInputs.push({ width })
      }
      const height = toNumber(safeProps.height)
      if (typeof height === 'number') {
        styleInputs.push({ height })
      }
      const styleForBox = mergeStyleProps(...styleInputs)
      let boxView = styledBox(childrenViews, {
        border: resolveBorderPreset(safeProps.border ?? safeProps.borderStyle ?? safeProps.variant),
        padding,
        minWidth: toNumber(safeProps.minWidth),
        minHeight: toNumber(safeProps.minHeight),
        style: styleForBox ? buildStyle(styleForBox) : undefined,
      })
      // 'fill'/'NN%' sizing resolves against the render context, which the
      // construction-time style path cannot see — route those through
      // fillView instead of the numeric style props.
      const widthSize = toSizeValue(safeProps.width)
      const heightSize = toSizeValue(safeProps.height)
      if (typeof widthSize === 'string' || typeof heightSize === 'string') {
        boxView = fillView(boxView, {
          width: typeof widthSize === 'string' ? widthSize : undefined,
          height: typeof heightSize === 'string' ? heightSize : undefined,
        })
      }
      return boxView
    }

    case 'panel': {
      const { children: _ignored, ...rest } = safeProps
      const panelStyle = mergeStyleProps(
        { background: rest.background ?? color.black, borderForeground: color.gray },
        extractStyleProps(rest.style)
      )
      const panelProps: Record<string, unknown> = {
        ...rest,
        border: rest.border ?? 'rounded',
        padding: rest.padding ?? 1,
        children: validChildren,
      }
      if (panelStyle) panelProps.style = panelStyle
      return renderJSX('box', panelProps)
    }

    case 'card': {
      const { children: _ignored, ...rest } = safeProps
      const cardStyle = mergeStyleProps(
        { background: rest.background ?? color.black, borderForeground: color.gray },
        extractStyleProps(rest.style)
      )
      const cardProps: Record<string, unknown> = {
        ...rest,
        border: rest.border ?? 'thin',
        padding: rest.padding ?? {
          top: 1,
          bottom: 1,
          left: 2,
          right: 2,
        },
        children: validChildren,
      }
      if (cardStyle) cardProps.style = cardStyle
      return renderJSX('box', cardProps)
    }

    case 'vstack': {
      const childrenViews = ensureViewArray(validChildren)
      const gap = toNumber(safeProps.gap) ?? 0
      let stacked: View
      if (gap > 0 && childrenViews.length > 1) {
        const spaced: View[] = []
        childrenViews.forEach((view, index) => {
          if (index > 0) {
            for (let i = 0; i < gap; i++) spaced.push(text(''))
          }
          spaced.push(view)
        })
        stacked = vstack(...spaced)
      } else {
        stacked = vstack(...childrenViews)
      }
      return applyFillProps(stacked, safeProps)
    }

    case 'hstack': {
      const childrenViews = ensureViewArray(validChildren)
      const gap = toNumber(safeProps.gap) ?? 0
      const joined = gap > 0 ? joinViews(childrenViews, gap) : hstack(...childrenViews)
      return applyFillProps(joined, safeProps)
    }

    case 'flex': {
      const childrenViews = collectFlexChildren(validChildren)
      const flexProps: FlexboxProps = {}
      const direction = mapFlexDirection(safeProps.direction)
      if (direction) flexProps.direction = direction
      const justify = mapJustifyContent(safeProps.justify ?? safeProps.justifyContent)
      if (justify) flexProps.justifyContent = justify
      const align = mapAlignItems(safeProps.align ?? safeProps.alignItems)
      if (align) flexProps.alignItems = align
      const wrap = mapFlexWrap(safeProps.wrap)
      if (wrap) flexProps.wrap = wrap
      const gap = toNumber(safeProps.gap)
      if (typeof gap === 'number') flexProps.gap = gap
      const rowGap = toNumber((safeProps as Record<string, unknown>).rowGap)
      if (typeof rowGap === 'number') flexProps.rowGap = rowGap
      const columnGap = toNumber((safeProps as Record<string, unknown>).columnGap)
      if (typeof columnGap === 'number') flexProps.columnGap = columnGap
      const padding = normalizePadding(safeProps.padding)
      if (padding) flexProps.padding = padding
      const width = toSizeValue(safeProps.width)
      if (width !== undefined) flexProps.width = width
      const height = toSizeValue(safeProps.height)
      if (height !== undefined) flexProps.height = height
      const bg = safeProps.bg ?? safeProps.background
      if (typeof bg === 'string') flexProps.background = bg
      return flexbox(childrenViews, flexProps)
    }

    case 'overlay': {
      const childrenViews = ensureViewArray(validChildren)
      const contentView =
        childrenViews.length === 0
          ? text('')
          : childrenViews.length === 1
            ? childrenViews[0]!
            : vstack(...childrenViews)
      return markOverlay(contentView, {
        x: toNumber(safeProps.x),
        y: toNumber(safeProps.y),
        scrim: safeProps.scrim === true || safeProps.scrim === 'true',
      })
    }

    case 'interactive': {
      const childrenViews = ensureViewArray(validChildren)
      const contentView =
        childrenViews.length === 0
          ? text('')
          : childrenViews.length === 1
            ? childrenViews[0]
            : vstack(...childrenViews)

      const disabled = safeProps.disabled === true || safeProps.disabled === 'true'
      const focusable = disabled
        ? false
        : safeProps.focusable === false || safeProps.focusable === 'false'
          ? false
          : true

      const interactiveProps: Record<string, unknown> = {
        disabled,
        focusable,
      }

      if (safeProps.className !== undefined) {
        interactiveProps.className = safeProps.className
      }
      if (safeProps.role !== undefined) {
        interactiveProps.role = safeProps.role
      }
      if (safeProps.tooltip !== undefined) {
        interactiveProps.tooltip = safeProps.tooltip
      }

      const possibleEvents = [
        'onClick',
        'onFocus',
        'onBlur',
        'onMouseEnter',
        'onMouseLeave',
        'onKeyPress',
        'onSubmit',
        'onChange',
        'onHover',
      ] as const

      for (const key of possibleEvents) {
        const handler = safeProps[key]
        if (typeof handler === 'function') {
          if (disabled && key === 'onClick') {
            continue
          }
          interactiveProps[key] = handler
        }
      }

      return wrapInteractiveView(contentView, interactiveProps)
    }

    case 'spacer': {
      const size = toNumber(safeProps.size) ?? 1
      const flex = toNumber((safeProps as Record<string, unknown>).flex) ?? 0
      return layoutSpacer({ size, flex })
    }

    // Scope Components
    case 'scope':
      return Scope({ ...safeProps, children: validChildren })

    case 'scope-content':
      return ScopeContent({ ...safeProps, children: validChildren })

    case 'scope-fallback':
      return ScopeFallback({ ...safeProps, children: validChildren })

    // Form / interactive intrinsics (cell-rendered; full widgets also in @tuix/ui)
    case 'button': {
      const kids = toTextContent(validChildren)
      const label = kids && kids.length > 0 ? kids : String(safeProps.label ?? 'OK')
      const focused = safeProps.focused === true
      return paintCell(focused ? `[ ${label} ]` : `( ${label} )`, safeProps)
    }
    case 'text-input':
    case 'input': {
      const bound = safeProps['bind:value']
      const boundRune =
        isRune(bound) && typeof (bound as StateRune<string>).$set === 'function'
          ? (bound as StateRune<string>)
          : null
      const value = stringProp(safeProps.value ?? (boundRune ? String(boundRune() ?? '') : bound))
      const placeholder = stringProp(safeProps.placeholder)

      // Two-way binding: a named bound rune registers a focusable whose
      // scoped key handler writes typed characters back through $set →
      // MVU set-msg → model → repaint. The name (not the closure, which is
      // recreated each render) is the stable focus id.
      let focused = safeProps.focused === true
      if (boundRune && safeProps.disabled !== true) {
        const focusId =
          typeof safeProps.id === 'string' && safeProps.id.length > 0
            ? `input:${safeProps.id}`
            : typeof boundRune.$key === 'string'
              ? `bind:${boundRune.$key}`
              : null
        if (focusId) {
          registerFocusable(focusId, makeBoundKeyHandler(boundRune, safeProps))
          if (safeProps.autoFocus === true && getFocusedId() === null) {
            setFocusedId(focusId)
          }
          focused = isFocused(focusId)
        } else {
          warnUnnamedBind()
        }
      }

      // Fixed-width interior keeps every field box the same size regardless
      // of value length (form-grid alignment).
      const widthHint = toNumber(safeProps.width)
      let shown = value.length > 0 ? value : placeholder
      if (widthHint && widthHint >= 4) {
        const interior = widthHint - 4
        shown = shown.slice(0, interior).padEnd(interior)
      }
      return paintCell(focused ? `▌ ${shown} ▐` : `[ ${shown} ]`, safeProps)
    }
    case 'textarea': {
      const fromChildren = toTextContent(validChildren)
      const value = stringProp(safeProps.value ?? safeProps['bind:value'] ?? fromChildren)
      return text(value.length ? value : stringProp(safeProps.placeholder))
    }
    case 'checkbox': {
      const checked = safeProps.checked === true || safeProps.value === true
      const kids = toTextContent(validChildren)
      const label = kids && kids.length > 0 ? kids : String(safeProps.label ?? '')
      return text(`${checked ? '[x]' : '[ ]'} ${label}`.trimEnd())
    }
    case 'toggle': {
      const on = safeProps.on === true || safeProps.checked === true || safeProps.value === true
      const kids = toTextContent(validChildren)
      const label = kids && kids.length > 0 ? kids : String(safeProps.label ?? '')
      return text(`${on ? '(•)' : '( )'} ${label}`.trimEnd())
    }
    case 'scrollview':
    case 'viewport': {
      const views = ensureViewArray(validChildren)
      return views.length === 1 ? views[0]! : vstack(...views)
    }

    default: {
      // Unknown intrinsics render as literal `[type]` text so the typo is
      // visible on screen — but it is almost always a bug, so warn once
      // per type (no spam on repeated renders).
      warnUnknownIntrinsic(type)
      debug(`[RUNTIME] Unknown element type: ${type}, creating text node`)
      return text(`[${type}]`)
    }
  }
}

const warnedUnknownIntrinsics = new Set<string>()

function warnUnknownIntrinsic(type: string): void {
  if (warnedUnknownIntrinsics.has(type)) return
  warnedUnknownIntrinsics.add(type)
  if (process.env.TUIX_SILENT_UNKNOWN_INTRINSICS) return
  console.warn(
    `[tuix] Unknown JSX element <${type}> — rendering literal [${type}]. ` +
      `Check the tag name; widgets come from @tuix/ui.`
  )
}

let warnedUnnamedBind = false
function warnUnnamedBind(): void {
  if (warnedUnnamedBind) return
  warnedUnnamedBind = true
  console.warn(
    '[tuix] bind:value on an input needs a named $state (e.g. $state("", "field") ' +
      'or $states({...})) for focus + write-back; rendering display-only.'
  )
}

/**
 * Scoped key handler for an input bound to a rune. Returns true when the
 * key was consumed (prevents broadcast to global handlers).
 */
function makeBoundKeyHandler(
  rune: StateRune<string>,
  props: Record<string, unknown>
): (key: string) => boolean {
  const current = () => String(rune() ?? '')
  const limit = toNumber(props.charLimit)
  const onChange = typeof props.onChange === 'function' ? props.onChange : undefined
  const onSubmit = typeof props.onSubmit === 'function' ? props.onSubmit : undefined

  return (key: string): boolean => {
    // The parser names the space key 'space'; every other printable arrives
    // as itself. Both must insert a character.
    const ch =
      key === 'space' || key === 'Space'
        ? ' '
        : key.length === 1 && key >= ' ' && key !== '\x1b'
          ? key
          : null
    // The legacy parser names Enter 'ctrl+m' (\r) / 'ctrl+j' (\n).
    if (key === 'enter' || key === 'Enter' || key === 'ctrl+m' || key === 'ctrl+j') {
      onSubmit?.(current())
      return true
    }
    if (key === 'backspace' || key === 'Backspace' || key === '\x7f') {
      const v = current()
      if (v.length > 0) {
        rune.$set(v.slice(0, -1))
        onChange?.(rune())
      }
      return true
    }
    if (ch !== null) {
      if (limit != null && limit >= 0 && current().length >= limit) return true
      rune.$set(current() + ch)
      onChange?.(rune())
      return true
    }
    return false
  }
}

export function jsx(
  type: string | Function,
  props: Record<string, unknown> | null,
  key?: string | number
): JSXElement {
  return createJSXElement(type, props, key, [])
}

export function jsxs(
  type: string | Function,
  props: Record<string, unknown> | null,
  key?: string | number
): JSXElement {
  return createJSXElement(type, props, key, [])
}

export function jsxDEV(
  type: string | Function,
  props: Record<string, unknown> | null,
  key?: string | number,
  _isStaticChildren?: boolean,
  source?: DevInfo['source'],
  self?: unknown
): JSXElement {
  return createJSXElement(type, props, key, [], { source, self })
}

/**
 * Render function - converts JSXNode or View into a concrete View ready for MVU runtime
 */
export function render(element: JSXNode | View): View {
  const result = renderChild(element)
  return result ?? text('')
}

/**
 * JSX Fragment component for grouping multiple elements without a wrapper
 *
 * Fragments allow you to group multiple JSX elements without adding an extra
 * container element to the DOM. Single children are returned as-is, multiple
 * children are automatically wrapped in a vertical stack.
 *
 * @param props - Fragment properties
 * @param props.children - Child elements to group
 * @returns A single View or vstack containing the children
 *
 * @example
 * ```tsx
 * // Multiple children get wrapped in vstack
 * <>
 *   <text>First line</text>
 *   <text>Second line</text>
 * </>
 *
 * // Single child returned as-is
 * <>
 *   <text>Only child</text>
 * </>
 * ```
 */
// Export Fragment support — always returns a View (children may be JSX descriptors)
export const Fragment = ({ children }: { children?: React.ReactNode }): View => {
  const childArray = Array.isArray(children) ? children : [children]
  const views = ensureViewArray(childArray)

  if (views.length === 0) {
    return text('')
  }

  if (views.length === 1) {
    return views[0]!
  }

  return vstack(...views)
}

/**
 * React-compatible createElement function
 *
 * Alias for the jsx function to maintain compatibility with React's createElement API.
 * This allows existing React components to work seamlessly with tuix.
 *
 * @param type - The element type (string for intrinsics, function for components)
 * @param props - Element properties/attributes object
 * @param children - Child elements
 * @returns A View object that can be rendered to the terminal
 *
 * @example
 * ```tsx
 * const element = createElement('text', { style: { color: 'blue' } }, 'Hello')
 * ```
 */
export function createElement(
  type: string | Function,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): JSXElement {
  return createJSXElement(type, props, null, children)
}

// Export JSX namespace types
export namespace JSX {
  export interface Element extends JSXElement {}

  export interface IntrinsicElements {
    text: {
      children?: unknown
      style?: Style
    }
    box: {
      children?: unknown
      style?: Style
      border?: string | boolean
      borderStyle?: string
      borderColor?: string
      padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
      margin?: number
      width?: number
      height?: number
      minWidth?: number
      minHeight?: number
      background?: string
      variant?: string
    }
    vstack: {
      children?: unknown
      gap?: number
      align?: 'left' | 'center' | 'right'
    }
    hstack: {
      children?: unknown
      gap?: number
      align?: 'top' | 'middle' | 'bottom'
    }
    'styled-text': { children?: unknown; style?: Style }
    styledText: { children?: unknown; style?: Style }

    // Scope Components
    scope: Record<string, unknown>
    'scope-content': Record<string, unknown>
    'scope-fallback': Record<string, unknown>

    // Form / interactive
    button: { children?: unknown; label?: string; focused?: boolean; onClick?: unknown }
    'text-input': {
      value?: string
      placeholder?: string
      focused?: boolean
      'bind:value'?: unknown
      id?: string
      autoFocus?: boolean
      charLimit?: number
      disabled?: boolean
      onChange?: (value: string) => void
      onSubmit?: (value: string) => void
    }
    input: {
      value?: string
      placeholder?: string
      focused?: boolean
      'bind:value'?: unknown
      id?: string
      autoFocus?: boolean
      charLimit?: number
      disabled?: boolean
      onChange?: (value: string) => void
      onSubmit?: (value: string) => void
    }
    textarea: {
      value?: string
      placeholder?: string
      children?: unknown
      'bind:value'?: unknown
    }
    checkbox: { checked?: boolean; value?: boolean; label?: string; children?: unknown }
    toggle: { on?: boolean; checked?: boolean; value?: boolean; label?: string; children?: unknown }
    overlay: { children?: unknown; x?: number; y?: number }
    scrollview: { children?: unknown }
    viewport: { children?: unknown }
  }

  export interface ElementChildrenAttribute {
    children: {}
  }
}

/**
 * Global JSX plugin registry instance
 *
 * Provides access to the central registry for managing plugins, commands,
 * and component lifecycle within the JSX runtime environment.
 *
 * @example
 * ```tsx
 * // Register a plugin
 * pluginRegistry.registerPlugin('myPlugin', pluginInstance)
 *
 * // Check if plugin exists
 * if (pluginRegistry.hasDeclarativePlugin('myPlugin')) {
 *   // Plugin is available
 * }
 * ```
 */
// Export the registry for plugin access
export const pluginRegistry = registry

// Convenience exports for common patterns
export const registerPlugin = registry.registerPlugin.bind(registry)
export const registerCommand = registry.registerCommand.bind(registry)
export const executeCommand = registry.executeCommand.bind(registry)
export const getScopeManager = registry.getScopeManager.bind(registry)

// Export JSXContext
export const JSXContext = {
  registry,
  getScopeManager,
}

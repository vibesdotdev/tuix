/**
 * JSX Runtime for CLI-KIT
 *
 * Enables JSX/TSX syntax for building terminal UIs
 * Uses React JSX transform with Svelte-inspired binding support
 */

import type { View } from "@tuix/core/types";
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
  type FlexboxProps,
} from "@tuix/view";
import { style, Style, color, border, type StyleProps } from "@tuix/ansi";
import {
  isBindableRune,
  isStateRune,
  scopeManager,
  getGlobalEventBus,
  Scope,
  ScopeContent,
  ScopeFallback,
  type BindableRune,
  type StateRune,
  type ScopeContext,
  type ScopeDef,
} from "@tuix/reactive";
import { config, templates } from "@tuix/config";
import { mergeDeep } from "@tuix/config/utils";
import * as fs from "fs/promises";
import * as path from "path";
import { Effect } from "effect";
import { getGlobalRegistry } from "@tuix/runtime";
import { JSXModule } from "@tuix/jsx/module";
import type { JSXPluginEvent, JSXCommandEvent } from "@tuix/jsx/events";
// import { onMount } from '../../reactivity/jsx-lifecycle' // TODO: Fix jsx-lifecycle import

import { jsxDebug } from "@tuix/debug";

// Debug logging that respects TUIX_DEBUG env var
const debug = jsxDebug.debug;

// Global plugin registry for JSX components - now uses stores
class JSXPluginRegistry {
  // Keep private fields that aren't replaced by stores
  private declarativePlugins: Map<
    string,
    {
      component: Function;
      metadata?: Record<string, unknown>;
      registeredAt: Date;
    }
  > = new Map();

  // Use the global scope manager
  private scopeManager = scopeManager;

  // Track current scope context
  private currentScopeId: string | null = null;
  private scopeIdStack: string[] = [];

  // JSX Module integration
  private jsxModule: JSXModule | null = null;

  // Command context for proper JSX evaluation
  private activeCommand: {
    path: string[]; // e.g., ['dev'] or ['dev', 'start']
    args: Record<string, string | number | boolean | undefined>;
    flags: Record<string, string | number | boolean | undefined>;
  } | null = null;

  // Global config manager
  private configManager: ConfigManager | null = null;

  constructor() {
    // Initialize JSX module if available
    this.initializeJSXModule();
  }

  private initializeJSXModule() {
    try {
      const registry = getGlobalRegistry();
      this.jsxModule = registry.getModule<JSXModule>("jsx");

      if (this.jsxModule) {
        debug("JSX Module found and initialized");
      }
    } catch (error) {
      debug("JSX Module not available yet:", error);
    }
  }

  // Helper to get current scope
  private getCurrentScope(): ScopeDef | null {
    if (!this.currentScopeId) return null;
    return this.scopeManager.getScopeDef(this.currentScopeId);
  }

  // Helper to push scope
  private pushScope(scope: ScopeDef): void {
    if (this.currentScopeId) {
      this.scopeIdStack.push(this.currentScopeId);
    }
    this.currentScopeId = scope.id;
    Effect.runSync(this.scopeManager.registerScope(scope));
  }

  // Helper to pop scope
  private popScope(): ScopeDef | null {
    const current = this.getCurrentScope();
    if (this.scopeIdStack.length > 0) {
      this.currentScopeId = this.scopeIdStack.pop()!;
    } else {
      this.currentScopeId = null;
    }
    return current;
  }

  // --- Plugin Store Integration (declarative) ---

  /**
   * Register a declarative plugin component
   * This is for JSX-based plugins, not loaded plugins
   */
  registerDeclarativePlugin(
    name: string,
    component: Function,
    metadata?: Record<string, unknown>
  ) {
    debug("Registering declarative plugin:", name);

    // Store the plugin component
    this.declarativePlugins.set(name, {
      component,
      metadata: metadata || {},
      registeredAt: new Date(),
    });

    // Create and register plugin scope
    const pluginScope: ScopeDef = {
      id: `plugin_${name}_${Date.now()}`,
      type: "plugin",
      name,
      path: [name],
      description: metadata?.description,
      executable: true,
      metadata,
      children: [],
    };

    this.pushScope(pluginScope);

    // Emit plugin event if JSX module is available
    if (this.jsxModule) {
      Effect.runSync(
        this.jsxModule.emitPluginStart(name, pluginScope as ScopeContext)
      );
    }

    return name;
  }

  /**
   * Unregister a declarative plugin
   */
  unregisterDeclarativePlugin(name: string) {
    debug("Unregistering declarative plugin:", name);

    // Find and remove the plugin scope
    const allScopes = this.scopeManager.getAllScopes();
    const pluginScope = allScopes.find(
      (s) => s.type === "plugin" && s.name === name
    );

    if (pluginScope) {
      Effect.runSync(this.scopeManager.removeScope(pluginScope.id));
    }

    // Remove from declarative plugins
    this.declarativePlugins.delete(name);

    // Pop scope if it's current
    if (this.currentScopeId === pluginScope?.id) {
      this.popScope();
    }

    // Emit plugin end event
    if (this.jsxModule && pluginScope) {
      Effect.runSync(this.jsxModule.emitPluginEnd(name));
    }
  }

  /**
   * Get a declarative plugin by name
   */
  getDeclarativePlugin(
    name: string
  ):
    | {
        component: Function;
        metadata?: Record<string, unknown>;
        registeredAt: Date;
      }
    | undefined {
    return this.declarativePlugins.get(name);
  }

  /**
   * List all declarative plugins
   */
  listDeclarativePlugins(): string[] {
    return Array.from(this.declarativePlugins.keys());
  }

  /**
   * Check if a declarative plugin exists
   */
  hasDeclarativePlugin(name: string): boolean {
    return this.declarativePlugins.has(name);
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
    debug("Registering loaded plugin:", name);

    // Import plugin store dynamically to avoid circular deps
    import { pluginStore } from "../plugins";

    // Use the store to register the plugin
    pluginStore.register(plugin);
    pluginStore.enable(name);

    // Create plugin scope
    const pluginScope: ScopeDef = {
      id: `plugin_${name}_${Date.now()}`,
      type: "plugin",
      name,
      path: [name],
      description,
      metadata: { version, plugin },
      executable: true,
      children: [],
    };

    this.pushScope(pluginScope);

    // Emit plugin start event
    if (this.jsxModule) {
      Effect.runSync(
        this.jsxModule.emitPluginStart(name, pluginScope as ScopeContext)
      );
    }

    return name;
  }

  /**
   * Unregister a loaded plugin
   */
  unregisterPlugin(name: string) {
    debug("Unregistering loaded plugin:", name);

    // Import plugin store dynamically
    import { pluginStore } from "../plugins";

    // Find the plugin scope
    const allScopes = this.scopeManager.getAllScopes();
    const pluginScope = allScopes.find(
      (s) => s.type === "plugin" && s.name === name
    );

    if (pluginScope) {
      // Pop scope if current
      if (this.currentScopeId === pluginScope.id) {
        this.popScope();
      }

      // Remove scope
      Effect.runSync(this.scopeManager.removeScope(pluginScope.id));
    }

    // Emit plugin end event
    if (this.jsxModule) {
      Effect.runSync(this.jsxModule.emitPluginEnd(name));
    }

    // Disable in store
    pluginStore.disable(name);
  }

  /**
   * Get a loaded plugin
   */
  getPlugin(name: string): Record<string, unknown> | null {
    import { pluginStore } from "../plugins";
    return pluginStore.isEnabled(name) ? pluginStore.getPlugin(name) : null;
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): string[] {
    import { pluginStore } from "../plugins";
    return pluginStore.listEnabled();
  }

  // --- Command Registration ---

  registerCommand(
    path: string[],
    handler: Function,
    metadata?: Record<string, unknown>
  ) {
    debug("Registering command:", path.join(" "));

    const currentScope = this.getCurrentScope();
    const parentPath = currentScope?.path || [];
    const fullPath = [...parentPath, ...path];

    // Create command scope
    const commandScope: ScopeDef = {
      id: `command_${fullPath.join("_")}_${Date.now()}`,
      type: "command",
      name: path[path.length - 1],
      path: fullPath,
      handler,
      executable: true,
      metadata,
      children: [],
    };

    // Register with scope manager
    Effect.runSync(this.scopeManager.registerScope(commandScope));

    // If current scope exists, add as child
    if (currentScope) {
      currentScope.children.push(commandScope);
    }

    // Emit command event if JSX module is available
    if (this.jsxModule) {
      Effect.runSync(
        this.jsxModule.emitCommandRegistered(
          fullPath,
          commandScope as ScopeContext
        )
      );
    }

    return fullPath.join(" ");
  }

  unregisterCommand(path: string[]) {
    debug("Unregistering command:", path.join(" "));

    // Find command scope
    const allScopes = this.scopeManager.getAllScopes();
    const commandScope = allScopes.find(
      (s) =>
        s.type === "command" &&
        s.path.length === path.length &&
        s.path.every((p, i) => p === path[i])
    );

    if (commandScope) {
      Effect.runSync(this.scopeManager.removeScope(commandScope.id));
    }
  }

  // --- Command Execution ---

  executeCommand(
    path: string[],
    args: Record<string, string | number | boolean | undefined> = {},
    flags: Record<string, string | number | boolean | undefined> = {}
  ) {
    debug("Executing command:", path.join(" "));

    // Find command scope
    const allScopes = this.scopeManager.getAllScopes();
    const commandScope = allScopes.find(
      (s) =>
        s.type === "command" &&
        s.path.length === path.length &&
        s.path.every((p, i) => p === path[i])
    );

    if (!commandScope || !commandScope.handler) {
      throw new Error(`Command not found: ${path.join(" ")}`);
    }

    // Execute handler
    return commandScope.handler({ args, flags });
  }

  // --- Context Management ---

  setActiveCommand(
    command: {
      path: string[];
      args: Record<string, string | number | boolean | undefined>;
      flags: Record<string, string | number | boolean | undefined>;
    } | null
  ) {
    this.activeCommand = command;
  }

  getActiveCommand() {
    return this.activeCommand;
  }

  // Context management for parent/child relationships
  pushContext(
    type: "plugin" | "command" | "component",
    id: string,
    data: Record<string, unknown>
  ) {
    const scope: ScopeDef = {
      id: `${type}_${id}_${Date.now()}`,
      type,
      name: id,
      path: this.getCurrentScope()?.path
        ? [...this.getCurrentScope()!.path, id]
        : [id],
      metadata: data,
      executable: type !== "component",
      children: [],
    };

    this.pushScope(scope);
    // The original code had this line commented out, but it seems necessary for context tracking
    // this.commandStack.push({ type, id, data })
  }

  popContext() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // const context = this.commandStack.pop()
    const poppedScope = this.popScope();

    // if (context && poppedScope) {
    //   debug(`Popped ${context.type} context:`, context.id)
    // }

    return null; // Return null as context is commented out
  }

  getCurrentContext() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return this.commandStack[this.commandStack.length - 1] || null
    return null; // Return null as context is commented out
  }

  getContextStack() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return [...this.commandStack]
    return []; // Return empty array as context is commented out
  }

  // Track renderable content for help generation
  pushRenderableContent(content: View | JSX.Element) {
    // The original code had this line commented out, but it seems necessary for context tracking
    // this.renderableContent.push(content)
  }

  popRenderableContent() {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return this.renderableContent.pop()
    return null; // Return null as renderableContent is commented out
  }

  hasRenderableContent(): boolean {
    // The original code had this line commented out, but it seems necessary for context tracking
    // return this.renderableContent.length > 0
    return false; // Return false as renderableContent is commented out
  }

  // Scope-aware state management
  getScopedState<T>(key: string, defaultValue?: T): T | undefined {
    // Look up the scope hierarchy for a state value
    let currentId = this.currentScopeId;
    while (currentId) {
      const scope = this.scopeManager.getScopeDef(currentId);
      if (scope?.metadata?.[key] !== undefined) {
        return scope.metadata[key];
      }
      // Move up to parent
      const state = this.scopeManager.getScope(currentId);
      currentId = state?.parentId || null;
    }
    return defaultValue;
  }

  setScopedState(key: string, value: unknown) {
    const currentScope = this.getCurrentScope();
    if (currentScope) {
      currentScope.metadata = currentScope.metadata || {};
      currentScope.metadata[key] = value;
    }
  }

  // Helper to get all plugins in the current scope
  getScopedPlugins(): Record<string, unknown>[] {
    const allScopes = this.scopeManager.getAllScopes();
    return allScopes
      .filter((s) => s.type === "plugin")
      .map((s) => s.metadata?.plugin)
      .filter(Boolean);
  }

  // Config management
  setConfigManager(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  getConfigManager() {
    return this.configManager;
  }

  // Get the scope manager for direct access
  getScopeManager() {
    return this.scopeManager;
  }

  // Helper methods for scope access
  getCurrentPlugin(): Record<string, unknown> | null {
    const currentScope = this.getCurrentScope();
    if (currentScope?.type === "plugin") {
      return currentScope.metadata?.plugin || null;
    }

    // Look up the scope hierarchy
    let currentId = this.currentScopeId;
    while (currentId) {
      const scope = this.scopeManager.getScopeDef(currentId);
      if (scope?.type === "plugin") {
        return scope.metadata?.plugin || null;
      }
      const state = this.scopeManager.getScope(currentId);
      currentId = state?.parentId || null;
    }

    return null;
  }

  getCurrentCommand(): ScopeDef | null {
    const currentScope = this.getCurrentScope();
    if (currentScope?.type === "command") {
      return currentScope;
    }

    // Look up the scope hierarchy
    let currentId = this.currentScopeId;
    while (currentId) {
      const scope = this.scopeManager.getScopeDef(currentId);
      if (scope?.type === "command") {
        return scope;
      }
      const state = this.scopeManager.getScope(currentId);
      currentId = state?.parentId || null;
    }

    return null;
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
    };
  }
}

// Create global registry instance
const registry = new JSXPluginRegistry();

type StyleInstance = ReturnType<typeof style>;

const INTERACTIVE_METADATA = Symbol.for("tuix.interactive");

const isStyleInstance = (value: unknown): value is StyleInstance => value instanceof Style;

const extractStyleProps = (value: unknown): Partial<StyleProps> | undefined => {
  if (!value) return undefined;
  if (isStyleInstance(value)) {
    return { ...value.props };
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.props && typeof record.props === "object") {
      return { ...(record.props as Partial<StyleProps>) };
    }
    return { ...(record as Partial<StyleProps>) };
  }
  return undefined;
};

const mergeStyleProps = (
  ...inputs: Array<Partial<StyleProps> | undefined>
): Partial<StyleProps> | undefined => {
  const filtered = inputs.filter(Boolean) as Partial<StyleProps>[];
  if (filtered.length === 0) return undefined;
  return filtered.reduce<Partial<StyleProps>>((acc, current) => ({ ...acc, ...current }), {});
};

const buildStyle = (
  ...inputs: Array<Partial<StyleProps> | undefined>
): StyleInstance => {
  const merged = mergeStyleProps(...inputs);
  if (!merged || Object.keys(merged).length === 0) {
    return style();
  }
  return style(merged);
};

const toTextContent = (children: unknown[]): string | null => {
  const segments: string[] = [];
  for (const child of children) {
    if (child == null) continue;
    const type = typeof child;
    if (type === "string" || type === "number" || type === "bigint") {
      segments.push(String(child));
      continue;
    }
    if (type === "boolean") {
      segments.push(child ? "true" : "false");
      continue;
    }
    if (type === "object" && "toString" in (child as Record<string, unknown>)) {
      const stringValue = (child as Record<string, unknown>).toString?.();
      if (stringValue && stringValue !== "[object Object]") {
        segments.push(stringValue);
        continue;
      }
    }
    return null;
  }
  return segments.join("");
};

const toView = (child: unknown): View | null => {
  if (isView(child)) return child;
  if (child && typeof child === "object" && "render" in (child as Record<string, unknown>)) {
    const candidate = child as View;
    if (typeof candidate.render === "function") {
      return candidate;
    }
  }
  const content = toTextContent([child]);
  if (content !== null) {
    return text(content);
  }
  return null;
};

const ensureViewArray = (children: unknown[]): View[] => {
  return children
    .map(toView)
    .filter((child): child is View => child !== null);
};

const joinViews = (views: View[], gap: number = 1): View => {
  if (views.length === 0) return text("");
  if (views.length === 1) return views[0];
  if (!Number.isFinite(gap) || gap <= 0) {
    return hstack(...views);
  }
  const spacer = text(" ".repeat(gap));
  const withGap: View[] = [];
  views.forEach((view, index) => {
    if (index > 0) {
      withGap.push(spacer);
    }
    withGap.push(view);
  });
  return hstack(...withGap);
};

const wrapInteractiveView = (
  child: View,
  props: Record<string, unknown>
): View => {
  const interactiveView: View & { [INTERACTIVE_METADATA]?: Record<string, unknown> } = {
    render: child.render.bind(child),
    width: child.width,
    height: child.height,
  };

  const events: Record<string, unknown> = {};
  const possibleEvents = [
    "onClick",
    "onFocus",
    "onBlur",
    "onMouseEnter",
    "onMouseLeave",
    "onKeyPress",
    "onSubmit",
    "onChange",
    "onHover",
  ];

  for (const key of possibleEvents) {
    const handler = props[key];
    if (typeof handler === "function") {
      events[key] = handler;
    }
  }

  const disabled = props.disabled === true || props.disabled === "true";
  const focusable = disabled ? false : props.focusable !== false;
  const metadata: Record<string, unknown> = {
    focusable,
    events,
    className: props.className,
    role: props.role,
    tooltip: props.tooltip,
    disabled,
  };

  Object.defineProperty(interactiveView, INTERACTIVE_METADATA, {
    value: metadata,
    enumerable: false,
    writable: false,
  });

  return interactiveView;
};

const toNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizePadding = (
  value: unknown
): { top?: number; right?: number; bottom?: number; left?: number } | undefined => {
  if (value == null) return undefined;
  if (typeof value === "number") {
    return { top: value, right: value, bottom: value, left: value };
  }
  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const vertical = toNumber(source.vertical);
    const horizontal = toNumber(source.horizontal);
    return {
      top: toNumber(source.top) ?? vertical ?? 0,
      bottom: toNumber(source.bottom) ?? vertical ?? 0,
      left: toNumber(source.left) ?? horizontal ?? 0,
      right: toNumber(source.right) ?? horizontal ?? 0,
    };
  }
  return undefined;
};

const resolveBorderPreset = (value: unknown) => {
  if (value === true || value === "true") return border.thin;
  if (!value || value === false || value === "false" || value === "none") return undefined;
  if (typeof value === "string") {
    const key = value.toLowerCase();
    switch (key) {
      case "single":
      case "thin":
        return border.thin;
      case "double":
        return border.double;
      case "rounded":
        return border.rounded;
      case "thick":
        return border.thick;
      case "ascii":
        return border.ascii;
      default:
        return undefined;
    }
  }
  return undefined;
};

const mapFlexDirection = (value: unknown): FlexDirection | undefined => {
  if (typeof value !== "string") return undefined;
  switch (value) {
    case "column":
      return FlexDirection.Column;
    case "column-reverse":
      return FlexDirection.ColumnReverse;
    case "row-reverse":
      return FlexDirection.RowReverse;
    case "row":
    default:
      return FlexDirection.Row;
  }
};

const mapJustifyContent = (value: unknown): JustifyContent | undefined => {
  if (typeof value !== "string") return undefined;
  switch (value) {
    case "center":
      return JustifyContent.Center;
    case "end":
    case "flex-end":
      return JustifyContent.End;
    case "between":
    case "space-between":
      return JustifyContent.SpaceBetween;
    case "around":
    case "space-around":
      return JustifyContent.SpaceAround;
    case "evenly":
    case "space-evenly":
      return JustifyContent.SpaceEvenly;
    case "start":
    case "flex-start":
    default:
      return JustifyContent.Start;
  }
};

const mapAlignItems = (value: unknown): AlignItems | undefined => {
  if (typeof value !== "string") return undefined;
  switch (value) {
    case "center":
      return AlignItems.Center;
    case "end":
    case "flex-end":
      return AlignItems.End;
    case "stretch":
      return AlignItems.Stretch;
    case "baseline":
      return AlignItems.Baseline;
    case "start":
    case "flex-start":
    default:
      return AlignItems.Start;
  }
};

const mapFlexWrap = (value: unknown): FlexWrap | undefined => {
  if (value === true || value === "wrap") return FlexWrap.Wrap;
  if (value === "reverse" || value === "wrap-reverse") return FlexWrap.WrapReverse;
  if (value === false || value === "nowrap" || value == null) return FlexWrap.NoWrap;
  return FlexWrap.NoWrap;
};

const headingPresetStyles: Record<number, Partial<StyleProps>> = {
  1: { bold: true, underline: true, foreground: color.white },
  2: { bold: true, foreground: color.white },
  3: { bold: true, foreground: color.gray },
  4: { bold: true },
  5: { foreground: color.gray },
  6: { faint: true, foreground: color.gray },
};

const SPINNER_FRAMES = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line: ["-", "\\", "|", "/"],
  circle: ["◐", "◓", "◑", "◒"],
  bounce: ["⠁", "⠂", "⠄", "⠂"],
  pulse: ["·", "•", "●", "•"],
  wave: ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█", "▇", "▆", "▅", "▄", "▃", "▂"],
} as const;

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
};

const BUTTON_SIZE_PADDING: Record<string, { vertical: number; horizontal: number }> = {
  small: { vertical: 0, horizontal: 1 },
  medium: { vertical: 1, horizontal: 2 },
  large: { vertical: 2, horizontal: 3 },
};

const DEFAULT_BORDER = "rounded";

const CHECKBOX_MARKS = {
  checked: "☑",
  unchecked: "☐",
};

const TOGGLE_MARKS = {
  on: "●",
  off: "○",
};

const TOAST_VARIANTS: Record<string, Partial<StyleProps>> = {
  info: { background: color.blue, foreground: color.white },
  success: { background: color.green, foreground: color.black },
  warning: { background: color.yellow, foreground: color.black },
  danger: { background: color.red, foreground: color.white },
};

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
 * const textElement = jsx('text', { style: { color: 'red' } }, 'Hello World')
 *
 * // Function component
 * const MyComponent = ({ name }: { name: string }) => jsx('text', null, `Hello ${name}`)
 * const componentElement = jsx(MyComponent, { name: 'Drew' })
 * ```
 *
 * @throws Error if the element type is unknown and cannot be converted to a text node
 */
// Export component registrations
export const jsx = (
  type: string | Function,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): View => {
  debug("[RUNTIME] Processing element type:", type, {
    props: props ? Object.keys(props) : null,
    key: props?.key,
  });

  // Handle null/undefined props
  const safeProps = props || {};

  const hiddenValue = (safeProps as Record<string, unknown>).hidden;
  if (hiddenValue === true || hiddenValue === "true") {
    return text("");
  }

  // Handle children - can be passed as props.children or as rest args
  const allChildren = safeProps.children
    ? Array.isArray(safeProps.children)
      ? safeProps.children
      : [safeProps.children]
    : children;

  // Filter out null/undefined children and flatten
  const validChildren = allChildren
    .flat(Infinity)
    .filter((child) => child != null);

  // Handle function components
  if (typeof type === "function") {
    debug("[RUNTIME] Calling function component:", type.name || "Anonymous");
    const componentProps = { ...safeProps, children: validChildren };
    const result = type(componentProps);
    debug("[RUNTIME] Function component returned:", typeof result);
    if (result && typeof result === "object") {
      debug("[RUNTIME] Result details:", {
        render: typeof result.render,
        width: result.width,
        height: result.height,
      });
    }
    return result;
  }

  // Handle built-in JSX intrinsics
  switch (type) {
    case "text": {
      const textContent = toTextContent(validChildren);
      const styleProps = extractStyleProps(safeProps.style);
      if (textContent !== null) {
        if (styleProps) {
          return styledText(textContent, buildStyle(styleProps));
        }
        return text(textContent);
      }
      const views = ensureViewArray(validChildren);
      return views.length === 1 ? views[0] : vstack(...views);
    }

    case "styled-text":
    case "styledText": {
      const textContent = toTextContent(validChildren) ?? "";
      const styleProps = mergeStyleProps(extractStyleProps(safeProps.style));
      return styledText(textContent, buildStyle(styleProps));
    }

    case "heading": {
      const level = Math.min(6, Math.max(1, Number(safeProps.level) || 1));
      const baseStyle = headingPresetStyles[level] ?? headingPresetStyles[1];
      const styleProps = mergeStyleProps(baseStyle, extractStyleProps(safeProps.style));
      const textContent = toTextContent(validChildren);
      if (textContent !== null) {
        return styledText(textContent, buildStyle(styleProps));
      }
      const views = ensureViewArray(validChildren);
      return views.length === 1 ? views[0] : vstack(...views);
    }

    case "code": {
      const base = {
        foreground: color.green,
        background: color.black,
      } satisfies Partial<StyleProps>;
      const styleProps = mergeStyleProps(base, extractStyleProps(safeProps.style));
      const textContent = toTextContent(validChildren) ?? "";
      return styledText(textContent, buildStyle(styleProps));
    }

    case "icon": {
      const glyph = typeof safeProps.glyph === "string" ? safeProps.glyph : undefined;
      const textContent = glyph ?? toTextContent(validChildren) ?? "";
      const styleProps = extractStyleProps(safeProps.style);
      return styledText(textContent, buildStyle(styleProps));
    }

    case "box": {
      const childrenViews = ensureViewArray(validChildren);
      const padding = normalizePadding(safeProps.padding);
      const resolvedStyle = extractStyleProps(safeProps.style);
      const styleInputs: Array<Partial<StyleProps> | undefined> = [resolvedStyle];
      if (safeProps.background) {
        styleInputs.push({ background: safeProps.background as any });
      }
      if ((safeProps as Record<string, unknown>).borderColor) {
        styleInputs.push({
          borderForeground: (safeProps as Record<string, unknown>).borderColor as any,
        });
      }
      if ((safeProps as Record<string, unknown>).borderBackground) {
        styleInputs.push({
          borderBackground: (safeProps as Record<string, unknown>).borderBackground as any,
        });
      }
      const width = toNumber(safeProps.width);
      if (typeof width === "number") {
        styleInputs.push({ width });
      }
      const height = toNumber(safeProps.height);
      if (typeof height === "number") {
        styleInputs.push({ height });
      }
      const styleForBox = mergeStyleProps(...styleInputs);
      const boxView = styledBox(childrenViews, {
        border: resolveBorderPreset(
          safeProps.border ?? safeProps.borderStyle ?? safeProps.variant
        ),
        padding,
        minWidth: toNumber(safeProps.minWidth),
        minHeight: toNumber(safeProps.minHeight),
        style: styleForBox ? buildStyle(styleForBox) : undefined,
      });
      return boxView;
    }

    case "panel": {
      const { children: _ignored, ...rest } = safeProps;
      const panelStyle = mergeStyleProps(
        { background: rest.background ?? color.black, borderForeground: color.gray },
        extractStyleProps(rest.style)
      );
      const panelProps: Record<string, unknown> = {
        ...rest,
        border: rest.border ?? "rounded",
        padding: rest.padding ?? 1,
        children: validChildren,
      };
      if (panelStyle) panelProps.style = panelStyle;
      return jsx("box", panelProps);
    }

    case "card": {
      const { children: _ignored, ...rest } = safeProps;
      const cardStyle = mergeStyleProps(
        { background: rest.background ?? color.black, borderForeground: color.gray },
        extractStyleProps(rest.style)
      );
      const cardProps: Record<string, unknown> = {
        ...rest,
        border: rest.border ?? "thin",
        padding:
          rest.padding ?? {
            top: 1,
            bottom: 1,
            left: 2,
            right: 2,
          },
        children: validChildren,
      };
      if (cardStyle) cardProps.style = cardStyle;
      return jsx("box", cardProps);
    }

    case "vstack": {
      const childrenViews = ensureViewArray(validChildren);
      return vstack(...childrenViews);
    }

    case "hstack": {
      const childrenViews = ensureViewArray(validChildren);
      return hstack(...childrenViews);
    }

    case "flex": {
      const childrenViews = ensureViewArray(validChildren);
      const flexProps: FlexboxProps = {};
      const direction = mapFlexDirection(safeProps.direction);
      if (direction) flexProps.direction = direction;
      const justify = mapJustifyContent(safeProps.justify ?? safeProps.justifyContent);
      if (justify) flexProps.justifyContent = justify;
      const align = mapAlignItems(safeProps.align ?? safeProps.alignItems);
      if (align) flexProps.alignItems = align;
      const wrap = mapFlexWrap(safeProps.wrap);
      if (wrap) flexProps.wrap = wrap;
      const gap = toNumber(safeProps.gap);
      if (typeof gap === "number") flexProps.gap = gap;
      const rowGap = toNumber((safeProps as Record<string, unknown>).rowGap);
      if (typeof rowGap === "number") flexProps.rowGap = rowGap;
      const columnGap = toNumber((safeProps as Record<string, unknown>).columnGap);
      if (typeof columnGap === "number") flexProps.columnGap = columnGap;
      const padding = normalizePadding(safeProps.padding);
      if (padding) flexProps.padding = padding;
      return flexbox(childrenViews, flexProps);
    }

    case "button": {
      const variant = typeof safeProps.variant === "string" ? safeProps.variant : "secondary";
      const size = typeof safeProps.size === "string" ? safeProps.size : "medium";
      const disabled = safeProps.disabled === true || safeProps.disabled === "true";
      const loading = safeProps.loading === true || safeProps.loading === "true";
      const gap = toNumber(safeProps.gap) ?? 1;

      const baseVariantStyle = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.secondary;
      const sizePaddingPreset = BUTTON_SIZE_PADDING[size] ?? BUTTON_SIZE_PADDING.medium;
      const paddingValue =
        safeProps.padding ??
        {
          vertical: sizePaddingPreset.vertical,
          horizontal: sizePaddingPreset.horizontal,
        };
      const padding = normalizePadding(paddingValue);

      const stateStyle = disabled
        ? {
            foreground: color.gray,
            background: color.black,
            borderForeground: color.gray,
          }
        : undefined;

      const buttonStyleProps = mergeStyleProps(
        baseVariantStyle,
        stateStyle,
        extractStyleProps(safeProps.style)
      );

      const contentViews = ensureViewArray(validChildren);
      if (contentViews.length === 0) {
        const label = safeProps.label ?? safeProps.text ?? "Button";
        contentViews.push(text(String(label)));
      }

      let iconView: View | null = null;
      if (safeProps.icon !== undefined && safeProps.icon !== null) {
        if (typeof safeProps.icon === "string") {
          iconView = styledText(safeProps.icon, buildStyle(buttonStyleProps));
        } else {
          iconView = toView(safeProps.icon);
        }
      }

      let spinnerView: View | null = null;
      if (loading) {
        spinnerView = styledText(
          SPINNER_FRAMES.dots[0] ?? "",
          buildStyle(buttonStyleProps)
        );
      }

      const iconPosition = safeProps.iconPosition === "right" ? "right" : "left";
      const orderedViews: View[] = [];
      if (iconView && iconPosition === "left") orderedViews.push(iconView);
      if (spinnerView) orderedViews.push(spinnerView);
      orderedViews.push(...contentViews);
      if (iconView && iconPosition === "right") orderedViews.push(iconView);

      const contentView = joinViews(orderedViews, gap);

      const buttonView = styledBox(contentView, {
        border: resolveBorderPreset(safeProps.border ?? DEFAULT_BORDER),
        padding,
        minWidth: toNumber(safeProps.minWidth),
        minHeight: toNumber(safeProps.minHeight),
        style: buttonStyleProps ? buildStyle(buttonStyleProps) : undefined,
      });

      const interactiveProps: Record<string, unknown> = {
        disabled,
        focusable: disabled ? false : safeProps.focusable,
        className: safeProps.className,
        role: safeProps.role ?? "button",
        tooltip: safeProps.tooltip,
        loading,
      };

      const forwardEvents = [
        "onClick",
        "onFocus",
        "onBlur",
        "onMouseEnter",
        "onMouseLeave",
        "onKeyPress",
        "onHover",
      ] as const;

      for (const key of forwardEvents) {
        const handler = safeProps[key];
        if (typeof handler === "function") {
          if (disabled && key === "onClick") continue;
          interactiveProps[key] = handler;
        }
      }

      return wrapInteractiveView(buttonView, interactiveProps);
    }

    case "spacer": {
      const size = toNumber(safeProps.size) ?? 1;
      const flex = toNumber((safeProps as Record<string, unknown>).flex) ?? 0;
      return layoutSpacer({ size, flex });
    }

    case "spinner": {
      const type = typeof safeProps.type === "string" ? safeProps.type : "dots";
      const frames = (SPINNER_FRAMES as Record<string, readonly string[]>)[type] ?? SPINNER_FRAMES.dots;
      const frame = frames[0] ?? "";
      const colorProp = safeProps.color as string | undefined;
      const spinnerStyle = mergeStyleProps(
        colorProp ? { foreground: colorProp as unknown as any } : undefined,
        extractStyleProps(safeProps.style)
      );
      const spinnerView = styledText(frame, buildStyle(spinnerStyle));

      if (safeProps.text) {
        const textChild = toView(safeProps.text) ?? styledText(String(safeProps.text), buildStyle());
        return hstack(spinnerView, textChild);
      }
      return spinnerView;
    }

    case "checkbox": {
      const disabled = safeProps.disabled === true || safeProps.disabled === "true";
      const bindChecked = (safeProps as Record<string, unknown>)["bind:checked"];

      const resolveChecked = (): boolean => {
        if (typeof safeProps.checked === "boolean") return safeProps.checked;
        if (isBindableRune<boolean>(bindChecked)) return !!bindChecked();
        if (isStateRune<boolean>(bindChecked)) return !!bindChecked();
        return Boolean(safeProps.defaultChecked);
      };

      const CheckedRune =
        (isBindableRune<boolean>(bindChecked) || isStateRune<boolean>(bindChecked)) && bindChecked
          ? (bindChecked as BindableRune<boolean> | StateRune<boolean>)
          : null;

      const checked = resolveChecked();

      const gap = toNumber((safeProps as Record<string, unknown>).gap) ?? 1;

      const markStyle = mergeStyleProps(
        {
          foreground: checked ? color.green : color.gray,
        },
        extractStyleProps(safeProps.style)
      );

      const markView = styledText(
        checked ? CHECKBOX_MARKS.checked : CHECKBOX_MARKS.unchecked,
        buildStyle(markStyle)
      );

      const labelViews = ensureViewArray(validChildren);
      if (labelViews.length === 0 && safeProps.label) {
        labelViews.push(text(String(safeProps.label)));
      }

      const contentView = labelViews.length === 0 ? markView : joinViews([markView, ...labelViews], gap);

      const handleToggle = () => {
        if (disabled) return;
        const current = resolveChecked();
        const next = !current;
        if (CheckedRune) {
          CheckedRune.$set(next);
        }
        if (typeof safeProps.onChange === "function") {
          (safeProps.onChange as (value: boolean) => void)(next);
        }
        if (typeof safeProps.onClick === "function") {
          (safeProps.onClick as (value: boolean) => void)(next);
        }
      };

      const interactiveProps: Record<string, unknown> = {
        disabled,
        checked,
        focusable: disabled ? false : safeProps.focusable,
        role: safeProps.role ?? "checkbox",
        className: safeProps.className,
        tooltip: safeProps.tooltip,
        onClick: handleToggle,
        onFocus: safeProps.onFocus,
        onBlur: safeProps.onBlur,
        onHover: safeProps.onHover,
      };

      return wrapInteractiveView(contentView, interactiveProps);
    }

    case "toggle": {
      const disabled = safeProps.disabled === true || safeProps.disabled === "true";
      const bindToggle = (safeProps as Record<string, unknown>)["bind:checked"] ??
        (safeProps as Record<string, unknown>)["bind:value"];

      const resolveToggle = (): boolean => {
        if (typeof safeProps.on === "boolean") return safeProps.on;
        if (typeof safeProps.checked === "boolean") return safeProps.checked;
        if (isBindableRune<boolean>(bindToggle)) return !!bindToggle();
        if (isStateRune<boolean>(bindToggle)) return !!bindToggle();
        return Boolean(safeProps.defaultOn ?? safeProps.defaultChecked);
      };

      const ToggleRune =
        (isBindableRune<boolean>(bindToggle) || isStateRune<boolean>(bindToggle)) && bindToggle
          ? (bindToggle as BindableRune<boolean> | StateRune<boolean>)
          : null;

      const on = resolveToggle();
      const gap = toNumber((safeProps as Record<string, unknown>).gap) ?? 1;

      const baseStyle = mergeStyleProps(
        {
          foreground: on ? color.green : color.gray,
          borderForeground: on ? color.green : color.gray,
        },
        extractStyleProps(safeProps.style)
      );

      const labelViews = ensureViewArray(validChildren);
      if (labelViews.length === 0 && safeProps.label) {
        labelViews.push(text(String(safeProps.label)));
      }

      const toggleBody = styledBox(text(on ? " ON " : " OFF "), {
        border: resolveBorderPreset(safeProps.border ?? DEFAULT_BORDER),
        padding: normalizePadding({ vertical: 0, horizontal: 1 }),
        style: baseStyle ? buildStyle(baseStyle) : undefined,
      });

      const contentView = labelViews.length === 0 ? toggleBody : joinViews([toggleBody, ...labelViews], gap);

      const handleToggle = () => {
        if (disabled) return;
        const current = resolveToggle();
        const next = !current;
        if (ToggleRune) {
          ToggleRune.$set(next);
        }
        if (typeof safeProps.onChange === "function") {
          (safeProps.onChange as (value: boolean) => void)(next);
        }
        if (typeof safeProps.onClick === "function") {
          (safeProps.onClick as (value: boolean) => void)(next);
        }
      };

      const interactiveProps: Record<string, unknown> = {
        disabled,
        on,
        focusable: disabled ? false : safeProps.focusable,
        role: safeProps.role ?? "switch",
        className: safeProps.className,
        tooltip: safeProps.tooltip,
        onClick: handleToggle,
        onFocus: safeProps.onFocus,
        onBlur: safeProps.onBlur,
        onHover: safeProps.onHover,
      };

      return wrapInteractiveView(contentView, interactiveProps);
    }

    case "modal": {
      const open = safeProps.open !== false && safeProps.open !== "false";
      if (!open) return text("");

      const titleViews = safeProps.title ? ensureViewArray([safeProps.title]) : [];
      const footerViews = safeProps.footer ? ensureViewArray([safeProps.footer]) : [];
      const bodyViews = ensureViewArray(validChildren);

      const sections: View[] = [];
      if (titleViews.length > 0) {
        sections.push(joinViews(titleViews, 1));
      }
      if (bodyViews.length > 0) {
        const body = bodyViews.length === 1 ? bodyViews[0] : vstack(...bodyViews);
        sections.push(body);
      }
      if (footerViews.length > 0) {
        sections.push(joinViews(footerViews, 1));
      }

      const contentView = sections.length === 0 ? text("") : vstack(...sections);

      const padding = normalizePadding(
        safeProps.padding ?? {
          vertical: 1,
          horizontal: 2,
        }
      );

      const modalStyle = mergeStyleProps(
        {
          background: color.black,
          foreground: color.white,
          borderForeground: color.gray,
        },
        extractStyleProps(safeProps.style)
      );

      const modalView = styledBox(contentView, {
        border: resolveBorderPreset(safeProps.border ?? "double"),
        padding,
        minWidth: toNumber(safeProps.minWidth),
        minHeight: toNumber(safeProps.minHeight),
        style: modalStyle ? buildStyle(modalStyle) : undefined,
      });

      return modalView;
    }

    case "tooltip": {
      const visible = safeProps.visible !== false && safeProps.visible !== "false";
      if (!visible) return text("");

      const contentSource = validChildren.length > 0 ? validChildren : [safeProps.content ?? ""];
      const contentViews = ensureViewArray(contentSource);
      const contentView = contentViews.length === 1 ? contentViews[0] : joinViews(contentViews, 1);

      const tooltipStyle = mergeStyleProps(
        {
          background: color.gray,
          foreground: color.black,
          borderForeground: color.gray,
        },
        extractStyleProps(safeProps.style)
      );

      const tooltipView = styledBox(contentView, {
        border: resolveBorderPreset(safeProps.border ?? DEFAULT_BORDER),
        padding: normalizePadding(
          safeProps.padding ?? {
            vertical: 0,
            horizontal: 1,
          }
        ),
        style: tooltipStyle ? buildStyle(tooltipStyle) : undefined,
      });

      return tooltipView;
    }

    case "toast": {
      const open = safeProps.open !== false && safeProps.open !== "false";
      if (!open) return text("");

      const kind = typeof safeProps.kind === "string" ? safeProps.kind : "info";
      const baseStyle = TOAST_VARIANTS[kind] ?? TOAST_VARIANTS.info;
      const toastStyle = mergeStyleProps(baseStyle, extractStyleProps(safeProps.style));

      const iconView = safeProps.icon
        ? toView(safeProps.icon) ?? styledText(String(safeProps.icon), buildStyle(toastStyle))
        : null;
      const messageSource = validChildren.length > 0 ? validChildren : [safeProps.message ?? ""];
      const messageViews = ensureViewArray(messageSource);
      const gap = toNumber((safeProps as Record<string, unknown>).gap) ?? 1;

      const parts: View[] = [];
      if (iconView) parts.push(iconView);
      parts.push(...messageViews);

      const contentView = joinViews(parts, gap);

      const toastView = styledBox(contentView, {
        border: resolveBorderPreset(safeProps.border ?? DEFAULT_BORDER),
        padding: normalizePadding(
          safeProps.padding ?? {
            vertical: 0,
            horizontal: 2,
          }
        ),
        style: toastStyle ? buildStyle(toastStyle) : undefined,
      });

      return toastView;
    }

    case "text-input":
    case "textarea": {
      const disabled = safeProps.disabled === true || safeProps.disabled === "true";
      const bindValue = (safeProps as Record<string, unknown>)["bind:value"];

      const resolveValue = (): string => {
        if (typeof safeProps.value === "string") return safeProps.value;
        if (isBindableRune<string>(bindValue)) return bindValue() ?? "";
        if (isStateRune<string>(bindValue)) return bindValue() ?? "";
        if (typeof safeProps.defaultValue === "string") return safeProps.defaultValue;
        return "";
      };

      const ValueRune =
        (isBindableRune<string>(bindValue) || isStateRune<string>(bindValue)) && bindValue
          ? (bindValue as BindableRune<string> | StateRune<string>)
          : null;

      const rawValue = resolveValue();
      const placeholder = typeof safeProps.placeholder === "string" ? safeProps.placeholder : "";
      const echoMode = typeof safeProps.echoMode === "string" ? safeProps.echoMode : "normal";

      const maskedValue = (() => {
        switch (echoMode) {
          case "password":
            return rawValue.length > 0 ? "•".repeat(rawValue.length) : "";
          case "none":
            return "";
          default:
            return rawValue;
        }
      })();

      const isEmpty = maskedValue.length === 0;
      const displayContent = isEmpty && placeholder ? placeholder : maskedValue;

      const width = toNumber(safeProps.width);
      const height = toNumber(safeProps.height);

      const baseStyle = extractStyleProps(safeProps.style);
      const placeholderStyle = isEmpty && placeholder
        ? { foreground: color.gray, italic: true }
        : undefined;

      const inputStyleProps = mergeStyleProps(baseStyle, placeholderStyle, {
        width,
        height,
      });
      const inputStyle = buildStyle(inputStyleProps);

      const valueText = styledText(displayContent, inputStyle);

      const boxStyleProps = mergeStyleProps(baseStyle, {
        width,
        height,
      });
      const inputBox = styledBox(valueText, {
        border: resolveBorderPreset(safeProps.border ?? DEFAULT_BORDER),
        padding: normalizePadding(
          safeProps.padding ?? {
            vertical: 0,
            horizontal: 1,
          }
        ),
        style: boxStyleProps ? buildStyle(boxStyleProps) : undefined,
      });

      const handleChange = (next: string) => {
        if (disabled) return;
        if (ValueRune) {
          ValueRune.$set(next);
        }
        if (typeof safeProps.onChange === "function") {
          (safeProps.onChange as (value: string) => void)(next);
        }
      };

      const handleSubmit = (next?: string) => {
        if (typeof safeProps.onSubmit === "function") {
          (safeProps.onSubmit as (value: string) => void)(next ?? rawValue);
        }
      };

      const interactiveProps: Record<string, unknown> = {
        disabled,
        focusable: disabled ? false : safeProps.focusable !== false,
        role: safeProps.role ?? (type === "textarea" ? "textbox" : "textbox"),
        className: safeProps.className,
        tooltip: safeProps.tooltip,
        onFocus: safeProps.onFocus,
        onBlur: safeProps.onBlur,
        onHover: safeProps.onHover,
        onChange: handleChange,
        onSubmit: handleSubmit,
        value: rawValue,
        placeholder,
        echoMode,
        multiline: type === "textarea",
      };

      return wrapInteractiveView(inputBox, interactiveProps);
    }


    // Scope Components
    case "scope":
      return Scope({ ...safeProps, children: validChildren });

    case "scope-content":
      return ScopeContent({ ...safeProps, children: validChildren });

    case "scope-fallback":
      return ScopeFallback({ ...safeProps, children: validChildren });

    default:
      // For unknown types, try to create a text node
      debug(`[RUNTIME] Unknown element type: ${type}, creating text node`);
      return text(`[${type}]`);
  }
};

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
// Export Fragment support
export const Fragment = ({ children }: { children?: React.ReactNode }) => {
  const childArray = Array.isArray(children) ? children : [children];
  const validChildren = childArray.filter((child) => child != null);

  if (validChildren.length === 0) {
    return text("");
  }

  if (validChildren.length === 1) {
    return validChildren[0];
  }

  return vstack(validChildren);
};

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
// Export createElement
export const createElement = jsx;

// Export JSX namespace types
export namespace JSX {
  export interface Element extends View {}

  export interface IntrinsicElements {
    text: { children?: unknown };
    box: {
      children?: unknown;
      style?: Style;
      padding?: number;
      margin?: number;
    };
    vstack: {
      children?: unknown;
      gap?: number;
      align?: "left" | "center" | "right";
    };
    hstack: {
      children?: unknown;
      gap?: number;
      align?: "top" | "middle" | "bottom";
    };
    "styled-text": { children?: unknown; style?: Style };
    styledText: { children?: unknown; style?: Style };

    // Scope Components
    scope: Record<string, unknown>;
    "scope-content": Record<string, unknown>;
    "scope-fallback": Record<string, unknown>;
  }

  export interface ElementChildrenAttribute {
    children: {};
  }
}

// Export jsx-runtime functions
export { jsx as jsxs, jsx as jsxDEV };

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
export const pluginRegistry = registry;

// Convenience exports for common patterns
export const registerPlugin = registry.registerPlugin.bind(registry);
export const registerCommand = registry.registerCommand.bind(registry);
export const executeCommand = registry.executeCommand.bind(registry);
export const getScopeManager = registry.getScopeManager.bind(registry);

// Export utilities
export { config, templates };

// Export JSXContext
export const JSXContext = {
  registry,
  getScopeManager,
};

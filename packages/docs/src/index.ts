/**
 * @tuix/docs - Documentation generation and interactive help system
 *
 * Provides tools for generating documentation from JSX components
 * and an interactive help explorer for browsing commands.
 *
 * @example
 * ```tsx
 * import { extractAppDoc, generateAppMarkdown, HelpExplorer } from '@tuix/docs'
 *
 * // Extract docs from app
 * const docs = extractAppDoc(MyApp, 'myapp', '1.0.0')
 *
 * // Generate markdown
 * const markdown = generateAppMarkdown(docs)
 *
 * // Or use interactive explorer
 * function HelpCommand() {
 *   return <HelpExplorer docs={docs} />
 * }
 * ```
 */

export type {
  CommandDoc,
  ArgDoc,
  OptionDoc,
  ExampleDoc,
  PluginDoc,
  AppDoc,
  DocGeneratorOptions,
  DocError,
} from './types'

export {
  extractCommandDoc,
  extractPluginDoc,
  extractAppDoc,
  extractAppDocFromScopes,
  generateCommandMarkdown,
  generatePluginMarkdown,
  generateAppMarkdown,
  generateCommandHelp,
  generateAppHelp,
} from './generator'

export { HelpExplorer } from './explorer'
export type { HelpExplorerProps } from './explorer'

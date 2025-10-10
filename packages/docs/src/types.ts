/**
 * @tuix/docs - Documentation types
 *
 * Types for documentation generation and help system.
 */

/**
 * Documentation for a command
 */
export interface CommandDoc {
  /**
   * Command name
   */
  name: string

  /**
   * Command description
   */
  description?: string

  /**
   * Command usage examples
   */
  usage?: string[]

  /**
   * Command arguments
   */
  args?: ArgDoc[]

  /**
   * Command options/flags
   */
  options?: OptionDoc[]

  /**
   * Related commands
   */
  related?: string[]

  /**
   * Examples
   */
  examples?: ExampleDoc[]
}

/**
 * Documentation for an argument
 */
export interface ArgDoc {
  /**
   * Argument name
   */
  name: string

  /**
   * Argument description
   */
  description?: string

  /**
   * Is this argument required?
   */
  required?: boolean

  /**
   * Default value
   */
  default?: string

  /**
   * Valid values
   */
  choices?: string[]
}

/**
 * Documentation for an option/flag
 */
export interface OptionDoc {
  /**
   * Short flag (e.g., '-v')
   */
  short?: string

  /**
   * Long flag (e.g., '--verbose')
   */
  long: string

  /**
   * Option description
   */
  description?: string

  /**
   * Does this option take a value?
   */
  takesValue?: boolean

  /**
   * Default value
   */
  default?: string
}

/**
 * Documentation example
 */
export interface ExampleDoc {
  /**
   * Example description
   */
  description: string

  /**
   * Example command
   */
  command: string
}

/**
 * Documentation for a plugin
 */
export interface PluginDoc {
  /**
   * Plugin name
   */
  name: string

  /**
   * Plugin description
   */
  description?: string

  /**
   * Commands provided by this plugin
   */
  commands: CommandDoc[]
}

/**
 * Complete application documentation
 */
export interface AppDoc {
  /**
   * Application name
   */
  name: string

  /**
   * Application description
   */
  description?: string

  /**
   * Application version
   */
  version?: string

  /**
   * All commands
   */
  commands: CommandDoc[]

  /**
   * All plugins
   */
  plugins: PluginDoc[]
}

/**
 * Documentation generation options
 */
export interface DocGeneratorOptions {
  /**
   * Include internal commands?
   */
  includeInternal?: boolean

  /**
   * Output format
   */
  format?: 'markdown' | 'text' | 'json'

  /**
   * Include examples?
   */
  includeExamples?: boolean
}

/**
 * Error type for documentation operations
 */
export interface DocError {
  _tag: 'DocError'
  message: string
  cause?: unknown
}

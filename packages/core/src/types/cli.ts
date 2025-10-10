/**
 * Core CLI Type definitions for TUIX framework
 */

import { z } from "zod";

/**
 * Configuration for individual CLI commands
 */
export interface CommandConfig {
  description: string;
  options?: Record<string, z.ZodSchema>;
  args?: Record<string, z.ZodSchema>;
  arguments?: z.ZodSchema[]; // Alternative to args
  commands?: Record<string, CommandConfig>; // Subcommands
  handler?: any; // Simplified for now, will be properly typed later
  aliases?: string[];
  hidden?: boolean;
  lazy?: boolean;
}

/**
 * Complete CLI application configuration
 */
export interface CLIConfig {
  name: string;
  version: string;
  description?: string;
  options?: Record<string, z.ZodSchema>;
  commands?: Record<string, CommandConfig>;
  plugins?: any[]; // Simplified for now
  settings?: Record<string, unknown>;
  hooks?: {
    preCommand?: (context: any) => Promise<void> | void;
    postCommand?: (context: any, result: unknown) => Promise<void> | void;
  };
  aliases?: Record<string, string>;
}

/**
 * Result of command-line argument parsing
 */
export interface ParsedArgs {
  command: string[];
  args: Record<string, unknown>;
  options: Record<string, unknown>;
  rawArgs: string[];
}

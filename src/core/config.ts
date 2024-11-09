//---
// core.config  - configuration
//---

// allow explicit `any` type to avoid too many type declaration during the
// "per-module" (github, watchers, ...) manipulation
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { existsSync, readFileSync } from 'node:fs'
import { parse as toml_parse } from '@iarna/toml'

// Internals

/**
 * __CONFIG_INFO - loaded configuration information
 */
let __CONFIG_INFO: { prefix: string; raw: any }

// Public

/**
 * config_init() - basic pseudo CLI handling
 */
export function config_init() {
  let config_prefix: string | undefined = undefined
  for (const arg of Bun.argv.slice(2)) {
    if (arg === '--help') {
      console.log(
        'only one argument is required: the path to the configuration folder\n' +
          '\n' +
          'Note that the folder must contains the `configuration.toml` file ' +
          'that describe critical information for the bot to operate'
      )
      process.exit(0)
    }
    if (config_prefix !== undefined) throw `unsupported CLI argument '${arg}'`
    if (!existsSync(arg)) throw `config prefix provided does not exits`
    if (!existsSync(`${arg}/config.toml`))
      throw `missing the \`configuration.toml\` file in the provided prefix`
    const config = toml_parse(
      readFileSync(`${arg}/config.toml`, { encoding: 'utf8' })
    )
    config_prefix = arg
    __CONFIG_INFO = {
      prefix: arg,
      raw: config,
    }
  }
  if (__CONFIG_INFO === undefined) throw 'missing configuration prefix'
}

/**
 * config_get_prefix() - return the configuration folder path
 * @returns - the configuration folder path
 */
export function config_get_prefix(): string {
  return __CONFIG_INFO.prefix
}

/**
 * config_get_raw() - return the user configuration
 * @returns - the raw loaded user configuration file information
 */
export function config_get_raw(): any {
  return __CONFIG_INFO.raw
}

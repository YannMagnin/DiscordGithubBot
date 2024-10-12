//---
// core.config  - configuration
//---

import { existsSync } from 'node:fs'

// Internals

var __CONFIG_PREFIX = '.discordgithubbot'
var __CONFIG_DISCORD_CHANNEL = 'github-tracking'

// Public

/**
 * config_init() - basic pseudo CLI handling
 */
export function config_init() {
  for (const arg of Bun.argv.slice(2)) {
    if (arg === '--help') {
      console.log(
        'flags supported for now:\n' +
          '  --config-prefix=<path>   configuration folder (.discordgithubbot)\n' +
          '  --discord-channel=<name> Discord channel to notify (github-tracking)\n' +
          '  --help                   display this message'
      )
      process.exit(0)
    }
    if (arg.startsWith('--discord-channel=')) {
      __CONFIG_DISCORD_CHANNEL = arg.substring(18)
      continue
    }
    if (arg.startsWith('--config-prefix=')) {
      __CONFIG_PREFIX = arg.substring(16)
      if (!existsSync(__CONFIG_PREFIX))
        throw `config prefix provided does not exits`
      continue
    }
    throw `unsupported CLI argument '${arg}'`
  }
}

/**
 * config_get_prefix() - return the configuration folder path
 * @returns - the configuration folder path
 */
export function config_get_prefix(): string {
  return __CONFIG_PREFIX
}

/**
 *
 * @returns -
 */
export function config_get_discord_channel(): string {
  return __CONFIG_DISCORD_CHANNEL
}

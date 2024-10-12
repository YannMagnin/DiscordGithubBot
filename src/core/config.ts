//---
// core.config  - configuration
//---

import { existsSync, readFileSync } from 'node:fs'
import { parse as toml_parse } from '@iarna/toml'

// Internals

/**
 * __CONFIG_INFO - loaded configuration information
 */
var __CONFIG_INFO: any | undefined = undefined

/**
 * __config_load() - try to load the main configuration file
 * @param prefix - configuration file prefix path
 */
function __config_load(prefix: string) {
  if (!existsSync(prefix)) throw `config prefix provided does not exits`
  if (!existsSync(`${prefix}/config.toml`))
    throw `missing the \`configuration.toml\` file in the provided prefix`
  const config: any = toml_parse(
    readFileSync(`${prefix}/config.toml`, { encoding: 'utf8' })
  )
  if (!('discord' in config))
    throw 'missing the critical discord configuration section'
  for (const prop of ['token', 'channel']) {
    if (!(prop in config.discord))
      throw `missing critical \`${prop}\` property in the configuration file`
  }
  __CONFIG_INFO = {
    prefix: prefix,
    'discord-token': config.discord.token,
    'discord-channel': config.discord.channel,
  }
}

// Public

/**
 * config_init() - basic pseudo CLI handling
 */
export function config_init() {
  var config_prefix: string | undefined = undefined
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
    if (config_prefix === undefined) {
      __config_load(arg)
      continue
    }
    throw `unsupported CLI argument '${arg}'`
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
 * config_get_discord_channel() - return the discord channel
 * @returns - the discord channel to send message
 */
export function config_get_discord_channel(): string {
  return __CONFIG_INFO['discord-channel']
}

/**
 * config_get_discord_token() - return the discord private token
 * @returns - the discord private token to communicate with the API
 */
export function config_get_discord_token(): string {
  return __CONFIG_INFO['discord-token']
}

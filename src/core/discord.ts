//---
// core.discord - discord abstraction
//---

import {
  Client,
  Events,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder,
} from 'discord.js'
import { sleep } from 'bun'
import { config_get_raw } from './config'

// internals

// todo : maybe use Promise instead of undefined ?
const __discord_client = new Client({ intents: [GatewayIntentBits.Guilds] })
let __discord_general_channel: TextChannel | undefined = undefined

/**
 * __discord_get_channel() - workarond to wait the Discord channel
 *
 * This is a dirty workaround to wait until the Discord client is logged and
 * that the bot channel is found. Also note that we should use `async` and
 * `await sleep` to allow the VM to proper schedule pending operation.
 *
 * @returns - the bot Discord channel
 */
async function __discord_get_channel(): Promise<TextChannel> {
  while (__discord_general_channel === undefined) {
    console.log('waiting login...')
    await sleep(1000)
  }
  return __discord_general_channel
}

// public

/**
 * DiscordEmbedBuilder - discord.js class alias
 */
export class DiscordEmbedBuilder extends EmbedBuilder {}

/**
 * discord_init() - initialise the discord bot
 *
 * We need to check if the bot token can be received, setup any other
 * abstraction stuff for the bridge between the core and the service and then
 * open a connection with the bot
 *
 * @param channel_name - channel name to target
 */
export function discord_init() {
  const config = config_get_raw()
  if (!('discord' in config))
    throw '[discord] missing the critical discord configuration section'
  for (const prop of ['token', 'channel', 'server']) {
    if (!(prop in config.discord))
      throw `[discord] missing critical \`${prop}\` property in the configuration file`
  }
  __discord_client.once(Events.ClientReady, (readyClient) => {
    console.log(`[discord] Ready! Logged in as ${readyClient.user.tag}`)
    const discord_server = readyClient.guilds.cache.find((guild) => {
      return guild.name === config.discord.server
    })
    if (discord_server === undefined)
      throw `[discord] unable to find the server ${config.discord.server}'`
    console.log(`[discord] server "${discord_server.name}" found !`)
    const channel = discord_server.channels.cache.find((channel) => {
      if ('name' in channel) return channel.name === config.discord.channel
      return false
    })
    if (channel === undefined)
      throw `[discord] unable to find the channel "${config.discord.channel}"`
    if (!(channel instanceof TextChannel))
      throw `[discord] the channel "${channel.name}" is not a text channel`
    console.log(`[discord] channel "${channel.name}" found !`)
    __discord_general_channel = channel
  })
  __discord_client.login(config.discord.token)
}

/**
 * discord_notification_send() - send embeds messages
 * @param embeds - discord.js embeds list
 */
export async function discord_notification_send(embeds: DiscordEmbedBuilder[]) {
  ;(await __discord_get_channel()).send({ embeds: embeds })
}

/**
 * discord_uninit() - invoked rigth before the process is killed
 */
export function discord_uninit() {
  // nothing to do here...(?)
}

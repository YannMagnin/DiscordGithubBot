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
import type { GithubCommit } from './github'
import { sleep } from 'bun'
import {
  config_get_discord_channel,
  config_get_discord_token,
  config_get_discord_server,
} from './config'

// internals

// todo : maybe use Promise instead of undefined ?
const __discord_client = new Client({ intents: [GatewayIntentBits.Guilds] })
var __discord_general_channel: TextChannel | undefined = undefined

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
 * discord_init() - initialise the discord bot
 *
 * We need to check if the bot token can be received, setup any other
 * abstraction stuff for the bridge between the core and the service and then
 * open a connection with the bot
 *
 * @param channel_name - channel name to target
 */
export function discord_init() {
  __discord_client.once(Events.ClientReady, (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`)
    const config_discord_server_name = config_get_discord_server()
    const discord_server = readyClient.guilds.cache.find((guild) => {
      return guild.name !== config_discord_server_name
    })
    if (discord_server === undefined)
      throw `[discord] unable to find the server ${config_discord_server_name}'`
    console.log(`[discord/init] server "${discord_server.name}" found !`)
    const config_discord_channel = config_get_discord_channel()
    const channel = discord_server.channels.cache.find((channel) => {
      if ('name' in channel) return channel.name === config_discord_channel
      return false
    })
    if (channel === undefined)
      throw `[discord/init] unable to find the channel "${config_discord_channel}"`
    if (!(channel instanceof TextChannel))
      throw `[discord/init] the channel "${config_discord_channel}" is not a text channel`
    console.log(`[discord/init] channel "${config_discord_channel}" found !`)
    __discord_general_channel = channel
  })
  __discord_client.login(config_get_discord_token())
}

/**
 * discord_notification_commit() - send new commit notification
 * @param commit - github commit information
 */
export async function discord_notification_commits(commits: GithubCommit[]) {
  if (commits.length == 0) return
  const embeds: EmbedBuilder[] = []
  for (const commit of commits) {
    const verified = commit.verified ? 'verified' : 'unverified'
    const signed = commit.signed ? 'signed' : 'unsigned'
    embeds.push(
      new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`[${commit.project}] 1 new commit`)
        .setAuthor({
          name: commit.author,
          iconURL: commit.author_icon,
          url: commit.url,
        })
        .setDescription(commit.body)
        .setURL(commit.url)
        .setFooter({
          text: `${commit.sha.substring(0, 7)} - ${verified} - ${signed} - ${
            commit.date
          }`,
        })
        .setTimestamp()
    )
  }
  ;(await __discord_get_channel()).send({ embeds: embeds })
}

/**
 * discord_notification_send() - send embeds messages
 * @param embeds - discord.js embeds list
 */
export async function discord_notification_send(embeds: EmbedBuilder[]) {
  ;(await __discord_get_channel()).send({ embeds: embeds })
}

/**
 * discord_uninit() - invoked rigth before the process is killed
 */
export function discord_uninit() {
  // nothing to do here...(?)
}

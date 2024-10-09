//---
// core.discord - discord abstraction
//---

import {
  Client,
  Events,
  GatewayIntentBits,
  TextChannel,
  EmbedBuilder
} from 'discord.js';
import type { GithubCommit } from './github';
import { sleep } from 'bun';

// internals

// todo : maybe use Promise instead of undefined ?
const __discord_client = new Client({ intents: [GatewayIntentBits.Guilds] });
var __discord_general_channel: TextChannel|undefined = undefined

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
 * Note that the DISCORD_TOKEN env variable is automatically loaded from the
 * `.env` file by Bun
 * 
 * @param channel_name - channel name to target
 */
export function discord_init(channel_name: string) {
  if (! ('DISCORD_TOKEN' in process.env))
    throw 'missing DISCORD_TOKEN env information'
  __discord_client.once(Events.ClientReady, readyClient => {
	  console.log(`Ready! Logged in as ${readyClient.user.tag}`)
    const channel =  __discord_client.channels.cache.find(channel => {
      if ('name' in channel)
        return channel.name === channel_name
      return false
    })
    if (channel === undefined)
      throw 'unable to find the target channel'
    if (! (channel instanceof TextChannel))
      throw 'the target channel is not a text channel'
    console.log('target channel found !')
    __discord_general_channel = channel
  })
  console.log(process.env.DISCORD_TOKEN)
  __discord_client.login(process.env.DISCORD_TOKEN);
}

/**
 * discord_notification_commit() - send new commit notification
 * @param commit - github commit information
 */
export async function discord_notification_commits(commits: GithubCommit[]) {
  if (commits.length == 0)
    return
  const embeds: EmbedBuilder[] = []
  for (const commit of commits) {
    const verified = commit.verified ? 'verified' : 'unverified'
    const signed = commit.signed ? 'signed' : 'unsigned'
    embeds.push(new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`[${commit.project}] 1 new commit`)
      .setAuthor({
        name: commit.author,
        iconURL: commit.author_icon,
        url: commit.url
      })
      .setDescription(commit.body)
      .setURL(commit.url)
      .setFooter({text: `${commit.sha.substring(0,7)} - ${verified} - ${signed}`})
      .setTimestamp()
    )
  }
  (await __discord_get_channel()).send({ embeds: embeds })
}
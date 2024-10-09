//---
// core.discord - discord abstraction
//---

import { Client, Events, GatewayIntentBits, TextChannel } from 'discord.js';

// internals

const __discord_client = new Client({ intents: [GatewayIntentBits.Guilds] });
var __discord_general_channel: TextChannel|undefined = undefined

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
 */
export function discord_init() {
  if (! ('DISCORD_TOKEN' in process.env))
    throw 'missing DISCORD_TOKEN env information'
  __discord_client.once(Events.ClientReady, readyClient => {
	  console.log(`Ready! Logged in as ${readyClient.user.tag}`)
    const channel =  __discord_client.channels.cache.find(channel => {
      if ('name' in channel)
        return channel.name === 'general'
      return false
    })
    if (channel === undefined)
      throw 'unable to find the general channel'
    if (! (channel instanceof TextChannel))
      throw 'the general channel is not a text channel'
    console.log('channel general found !')
    __discord_general_channel = channel
    __discord_general_channel.send('test message 2')
  })
  console.log(process.env.DISCORD_TOKEN)
  __discord_client.login(process.env.DISCORD_TOKEN);
}
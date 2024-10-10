//---
// main	- main entry of the bot
//---

import { discord_init, discord_notification_commits } from './core/discord'
import { watcher_add } from './core/watcher'
import { GithubProject } from './core/github'

console.log('cc cmoa')

discord_init('github')

// todo : configuration loading
const github_repo = new GithubProject('YannMagnin/DiscordBotPerso')

watcher_add('test', 3 * 60, github_repo)
console.log('waiting interruption')

// now the program will never end until all watcher stop (which is not
// implemented for now)

//---
// main	- main entry of the bot
//---

import { discord_init } from './core/discord'
import { watcher_add } from './core/watcher'

console.log('cc cmoa')

discord_init('github-tracking')

const config_file = Bun.file('.discordgithubbot/config.json')
const config_info = await config_file.json()
for (const project of config_info.watchers) {
  watcher_add(project.project, project, config_info.committer_aliases)
}

// now the program will never end until all watcher stop (which is not
// implemented for now)

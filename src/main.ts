//---
// main	- main entry of the bot
//---

import { discord_init, discord_uninit } from './core/discord'
import { watcher_init, watcher_unint } from './core/watcher'
import { config_init } from './core/config'

config_init()
discord_init()
watcher_init()

process.on('SIGINT', () => {
  watcher_unint()
  discord_uninit()
  process.exit(0)
})

// now the program will never end until a process kill occur

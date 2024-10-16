//---
// main	- main entry of the bot
//---

import { discord_init, discord_uninit } from './core/discord'
import { watcher_init, watcher_unint } from './core/watcher'
import { config_init } from './core/config'
import { github_init } from './core/github'

// Internals

function __init() {
  config_init()
  discord_init()
  github_init()
  watcher_init()
}

function __quit() {
  watcher_unint()
  discord_uninit()
  process.exit(0)
}

// Public

__init()

process.on('SIGINT', __quit)
process.on('SIGKILL', __quit)
process.on('SIGTERM', __quit)

// now the program will never end until a process kill or exit occur

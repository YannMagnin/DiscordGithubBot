//---
// main	- main entry of the bot
//---

import { discord_init } from "./core/discord"

//import { watcher_add } from './core/watcher'
//import { GithubProject } from './core/github'

console.log('cc cmoa')

//const github_repo = new GithubProject('YannMagnin/FakeCommit')

//watcher_add('test', 30, github_repo)
//console.log('waiting interruption')

// now the program will never end until all watcher stop (which is not
// implemented for now)

discord_init()

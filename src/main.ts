//---
// main	- main entry of the bot
//---

import { watcher_add } from './core/watcher'
import { GithubProject } from './core/github'

console.log('cc cmoa')

const github_repo = new GithubProject('YannMagnin/FakeRepo')

watcher_add('test', 60, github_repo)
console.log('waiting interruption')

// now the program will never end until all watcher stop (which is not
// implemented for now)

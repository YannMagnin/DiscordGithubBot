//---
// main	- main entry of the bot
//---

import { discord_init, discord_notification_commits } from "./core/discord"
import { GithubCommit } from "./core/github"

//import { watcher_add } from './core/watcher'
//import { GithubProject } from './core/github'

console.log('cc cmoa')

//const github_repo = new GithubProject('YannMagnin/FakeCommit')

//watcher_add('test', 30, github_repo)
//console.log('waiting interruption')

// now the program will never end until all watcher stop (which is not
// implemented for now)

const commit = new GithubCommit()
commit.sha = '14891e2a955456a828bb455db6957c9f326d3921'
commit.author = 'Yann MAGNIN'
commit.author_icon = 'https://avatars.githubusercontent.com/u/42215723?v=4'
commit.branch = 'master'
commit.project = 'CrupyDSL'
commit.verified = true
commit.signed = false
commit.url = 'https://github.com/YannMagnin/CrupyDSL/commit/9e4cf88772d590fdd61448377d382c7dc103e9c4'
commit.title = 'CrupyDSLParser - v0.0.4-dev7 : small fixes'
commit.body = '**Project**\n' +
  '- fix(github) : use CPython 3.9 instead of 3.11\n' +
  '\n' +
  '**Grammar**\n' +
  '- fix(base)! : force all subclass to the form `CrupyDSLGrammar*`\n' +
  '- fix(exception)! : force all subclass to the form `CrupyDSLGrammar*Exception`\n' +
  '- update(poetry) : bump dependencies\n' +
  '\n' +
  '**Parser**\n' +
  '- fix(base)! : force all subclass to the form `CrupyDSLParser*`\n' +
  '- fix(node)! : force all subclass to the form `CrupyDSLParserNode*`\n' +
  '- fix(exception)! : force all subclass to the form `CrupyDSLParser*Exception`\n'

await discord_init()
discord_notification_commits([commit])

//---
// core.watcher - timer abstraction
//---

import { EmbedBuilder } from 'discord.js'
import {
  discord_notification_commits,
  discord_notification_send,
} from './discord'
import { GithubProject } from './github'
import { CONFIG_PREFIX } from './config'

// Internals

/**
 * __watcher_dict - internal watcher dictionary
 */
var __watcher_dict: { [id: string]: __WatcherItem } = {}

/**
 * __WatcherItem - watcher item
 *
 * A watcher is a job that will, monotonicaly, scan the associated Github
 * project. Since we want to have enough granularity to have separated scanning
 * timing  between all project, we need to create a custom class that simply
 * abtract the scanning timer for a particular project.
 */
class __WatcherItem {
  name: string
  project: GithubProject
  scan_interval_min: number
  _timer: Timer | null

  constructor(name: string, scan_interval_min: number, project: GithubProject) {
    this.name = name
    this.scan_interval_min = scan_interval_min
    this.project = project
    this._timer = null
  }

  // public methods

  /**
   * start() - start the timer
   */
  start() {
    if (this._timer !== null)
      throw `unable to start the watcher '${this.name}': timer already used`
    this._timer = setInterval(async () => {
      console.log(`watcher need a refresh for "${this.name}"`)
      const commits = await this.project.check_new_commits()
      if (commits.length > 0) discord_notification_commits(commits)
    }, this.scan_interval_min * 60 * 1000)
  }

  /**
   * stop() - stop the watcher and export information
   * @returns - watcher information
   */
  stop() {
    var status = 'stopped'
    if (this._timer !== null) {
      status = 'running'
      clearInterval(this._timer)
      this._timer = null
    }
    return {
      api: 'github',
      project: this.project.repo_uri,
      scan_interval_min: this.scan_interval_min,
      last_commit_scan_timestamp: this.project._last_commit_scan_timestamp,
      status: status,
    }
  }
}

/**
 * __watcher_emit_warning() - generate the warning message
 *
 * Note: Discord poorly handle nested list and require
 *
 * @param warnings - internal warning object
 */
export function __watcher_emit_warning(warnings: any) {
  var new_watchers = ''
  var workarond = '    '
  for (const watcher of warnings.new_watcher) {
    new_watchers += `- **[${watcher.project}](https://google.fr)**\n`
    for (const prop in watcher) {
      if (prop === 'project') continue
      new_watchers += `${workarond}- **${prop}**: \`${watcher[prop]}\`\n`
      workarond = '   '
    }
  }
  var diff_watchers = ''
  var workarond = '    '
  for (const watcher in warnings.lock_diff) {
    diff_watchers += `- **${watcher}**\n`
    for (const prop in warnings.lock_diff[watcher]) {
      diff_watchers += `${workarond}- **${prop}**: `
      diff_watchers += `\`${warnings.lock_diff[watcher][prop][1]}\` ⇒`
      diff_watchers += `\`${warnings.lock_diff[watcher][prop][0]}\`\n`
      workarond = '   '
    }
  }
  if (new_watchers === '' && diff_watchers === '') return
  console.log('-- lock file updated')
  const embed = new EmbedBuilder()
    .setColor(0xc75820)
    .setTitle('Configuration update')
    .setDescription('Update the configuration lock file')
    .setAuthor({ name: 'GithubBotApp' })
  if (new_watchers)
    embed.addFields({ name: 'New watchers', value: new_watchers })
  if (diff_watchers)
    embed.addFields({ name: 'Update watchers', value: diff_watchers })
  discord_notification_send([embed])
}

// Public

/**
 * watcher_init() - load the configuration file and start all watchers
 * @param config_path - configuration file path
 */
export async function watcher_init() {
  const warning_report: { new_watcher: any[]; lock_diff: any } = {
    new_watcher: [],
    lock_diff: {},
  }
  const config_file = Bun.file(`${CONFIG_PREFIX}/config.json`)
  if (!(await config_file.exists()))
    throw `missing the configuration file "${CONFIG_PREFIX}/config.json"`
  const config_info = await config_file.json()
  const lock_file = Bun.file(`${CONFIG_PREFIX}/config.lock.json`)
  const lock_info = (await lock_file.exists()) ? await lock_file.json() : {}
  for (const project of config_info.watchers) {
    if (!(project.project in lock_info)) {
      watcher_add(project)
      warning_report.new_watcher.push(project)
      continue
    }
    const lock_project = lock_info[project.project]
    for (const property of ['api', 'scan_interval_min']) {
      if (project[property] !== lock_project[property]) {
        if (!(project.project in warning_report.lock_diff))
          warning_report.lock_diff[project.project] = {}
        warning_report.lock_diff[project.project][property] = [
          project[property],
          lock_project[property],
        ]
        lock_project[property] = project[property]
      }
    }
    watcher_add(lock_project)
  }
  __watcher_emit_warning(warning_report)
}

/**
 * watcher_add() - add a new watcher
 * @param name watcher name (used to perform operation on the watcher)
 * @param scan_interval_sec scanning interval in seconds
 * @param project github project to scan
 */
export function watcher_add(project: any) {
  if (project.project in __watcher_dict)
    throw `unable to add the new watcher "${project.project}": already registered`
  console.log(`[+] register a new github watcher : ${project.project}`)
  __watcher_dict[project.project] = new __WatcherItem(
    project.project,
    project.scan_interval_min,
    new GithubProject(project.project)
  )
  __watcher_dict[project.project].start()
}

/**
 * watcher_unint() - stop all watcher and export information
 */
export function watcher_unint() {
  const watcher_exports: { [id: string]: any } = {}
  for (const watcher in __watcher_dict) {
    console.log(`[+] stopping watcher ${watcher}`)
    watcher_exports[watcher] = __watcher_dict[watcher].stop()
  }
  if (Object.keys(watcher_exports).length === 0) return
  Bun.write(
    `${CONFIG_PREFIX}/config.lock.json`,
    JSON.stringify(watcher_exports)
  )
}

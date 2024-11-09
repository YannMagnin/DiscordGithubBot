//---
// core.watcher - timer abstraction
//---

import { discord_notification_send, DiscordEmbedBuilder } from './discord'
import { github_generate_url, GithubProject } from './github'
import { config_get_prefix } from './config'

//---
// Internals
//---

/**
 * __watcher_dict - internal watcher dictionary
 */
const __watcher_dict: { [id: string]: __WatcherItem } = {}

/**
 * __WatcherExport - internal watcher export information
 */
interface __WatcherExport {
  api: string
  project: string
  scan_interval_min: number
  last_commit_scan_timestamp: number
  status: 'running' | 'stopped'
}

/**
 * ProjectConfig - loaded project configuration
 *
 * Note:
 * force indicate the `key` stuff, otherwise we cannot access to any of the
 * elements of an interface
 */
interface __WatcherProjectConfig {
  [key: string]: number | undefined | string
  project: string
  scan_interval_min: number
  last_commit_scan_timestamp?: number
}

/**
 * __WatcherWarningReport - internal warning report (loading process)
 */
interface __WatcherWarningReport {
  new_watcher: __WatcherProjectConfig[]
  lock_diff: { [project_name: string]: { [property: string]: string[] } }
}

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
    this._timer = setInterval(
      async () => {
        console.log(`watcher need a refresh for "${this.name}"`)
        this.project.check_new_commits().then((has_new_commits) => {
          if (has_new_commits) watcher_export()
        })
      },
      this.scan_interval_min * 60 * 1000
    )
  }

  /**
   * export() - export watcher information
   * @returns - watcher information
   */
  export(): __WatcherExport {
    return {
      api: 'github',
      project: this.project.repo_uri,
      scan_interval_min: this.scan_interval_min,
      last_commit_scan_timestamp: this.project.last_commit_scan_timestamp,
      status: this._timer !== null ? 'running' : 'stopped',
    }
  }

  /**
   * stop() - stop the watcher and export information
   */
  stop() {
    if (this._timer !== null) {
      clearInterval(this._timer)
      this._timer = null
    }
  }
}

/**
 * __watcher_emit_warning() - generate the warning message
 *
 * Note: Discord poorly handle nested list and require full 4-space indent for
 * the firt item then only 3-spaces...otherwise it will nest all other items
 *
 * @param warnings - internal warning object
 */
function __watcher_emit_warning(warnings: __WatcherWarningReport) {
  let new_watchers = ''
  let workarond = '    '
  for (const watcher of warnings.new_watcher) {
    const project_url = github_generate_url(watcher.project)
    new_watchers += `- **[${watcher.project}](${project_url})**\n`
    for (const prop in watcher) {
      if (prop === 'project') continue
      new_watchers += `${workarond}- **${prop}**: \`${watcher[prop]}\`\n`
      workarond = '   '
    }
  }
  let diff_watchers = ''
  workarond = '    '
  for (const watcher in warnings.lock_diff) {
    const project_url = github_generate_url(watcher)
    diff_watchers += `- **[${watcher}](${project_url})**\n`
    for (const prop in warnings.lock_diff[watcher]) {
      diff_watchers += `${workarond}- **${prop}**: `
      diff_watchers += `\`${warnings.lock_diff[watcher][prop][1]}\` ⇒`
      diff_watchers += `\`${warnings.lock_diff[watcher][prop][0]}\`\n`
      workarond = '   '
    }
  }
  if (new_watchers === '' && diff_watchers === '') return
  console.log('-- lock file updated')
  const embed = new DiscordEmbedBuilder()
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

/**
 * watcher_add() - add a new watcher
 * @param project project to watch
 */
function __watcher_add(project: __WatcherProjectConfig) {
  if (project.project in __watcher_dict)
    throw `unable to add the new watcher "${project.project}": already registered`
  let last_commit_scan_timestamp = project.last_commit_scan_timestamp
  if (last_commit_scan_timestamp === undefined) {
    console.log('-- use the current date as `last_commit_scan_timestamp`')
    last_commit_scan_timestamp = Date.now()
  }
  __watcher_dict[project.project] = new __WatcherItem(
    project.project,
    project.scan_interval_min,
    new GithubProject(project.project, last_commit_scan_timestamp)
  )
  __watcher_dict[project.project].start()
}

//---
// Public
//---

/**
 * watcher_init() - load the configuration file and start all watchers
 * @param config_path - configuration file path
 */
export async function watcher_init() {
  const config_prefix = config_get_prefix()
  const warning_report: __WatcherWarningReport = {
    new_watcher: [],
    lock_diff: {},
  }
  const config_file = Bun.file(`${config_prefix}/watchers.json`)
  if (!(await config_file.exists()))
    throw `missing the configuration file "${config_prefix}/watchers.json"`
  const config_info = await config_file.json()
  const lock_file = Bun.file(`${config_prefix}/watchers.lock.json`)
  const lock_info = (await lock_file.exists()) ? await lock_file.json() : {}
  for (const project of config_info.watchers) {
    console.log(`[+] register a new github watcher : ${project.project}`)
    if (!(project.project in lock_info)) {
      __watcher_add(project)
      warning_report.new_watcher.push(project)
      continue
    }
    console.log('-- load project from the lock file')
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
    __watcher_add(lock_project)
  }
  __watcher_emit_warning(warning_report)
}

/**
 * watcher_export() - export current watcher snapshot
 */
export function watcher_export(stop: boolean = false) {
  console.log('[watcher] updating lock file')
  const config_prefix = config_get_prefix()
  const watcher_exports: { [id: string]: __WatcherExport } = {}
  for (const watcher in __watcher_dict) {
    console.log(`[+] exporting watcher ${watcher}`)
    watcher_exports[watcher] = __watcher_dict[watcher].export()
    if (stop) {
      console.log(`[+] stopping watcher ${watcher}`)
      __watcher_dict[watcher].stop()
    }
  }
  if (Object.keys(watcher_exports).length === 0) return
  Bun.write(
    `${config_prefix}/watchers.lock.json`,
    JSON.stringify(watcher_exports)
  )
}

/**
 * watcher_unint() - stop all watcher and export information
 */
export function watcher_unint() {
  watcher_export(true)
}

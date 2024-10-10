//---
// core.watcher - timer abstraction
//---

import { discord_notification_commits } from './discord'
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

// Public

/**
 * watcher_init() - load the configuration file and start all watchers
 * @param config_path - configuration file path
 */
export async function watcher_init() {
  const config_file = Bun.file(`${CONFIG_PREFIX}/config.json`)
  const config_info = await config_file.json()
  for (const project of config_info.watchers) {
    watcher_add(project.project, project, config_info.committer_aliases)
  }
}

/**
 * watcher_add() - add a new watcher
 * @param name watcher name (used to perform operation on the watcher)
 * @param scan_interval_sec scanning interval in seconds
 * @param project github project to scan
 */
export function watcher_add(
  name: string,
  project: any,
  committer_aliases: any[]
) {
  if (name in __watcher_dict)
    throw `unable to add the new watcher "${name}": already registered`
  console.log(`[+] register a new github watcher : ${name}`)
  __watcher_dict[name] = new __WatcherItem(
    name,
    project.scan_interval_min,
    new GithubProject(project.project)
  )
  __watcher_dict[name].start()
}

/**
 * watcher_unint() - stop all watcher and export information
 */
export function watcher_unint() {
  const watcher_exports = []
  for (const watcher in __watcher_dict) {
    console.log(`[+] stopping watcher ${watcher}`)
    watcher_exports.push(__watcher_dict[watcher].stop())
  }
  if (watcher_exports.length === 0) return
  Bun.write(
    `${CONFIG_PREFIX}/config.lock.json`,
    JSON.stringify(watcher_exports)
  )
}

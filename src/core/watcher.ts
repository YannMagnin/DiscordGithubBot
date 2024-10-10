//---
// core.watcher - timer abstraction
//---

import { discord_notification_commits } from './discord'
import type { GithubProject } from './github'

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
  scan_interval_sec: number
  _timer: Timer | null

  constructor(name: string, scan_interval_sec: number, project: GithubProject) {
    this.name = name
    this.scan_interval_sec = scan_interval_sec
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
    }, this.scan_interval_sec * 500)
    console.log('watcher started')
  }
}

// Public

/**
 * watcher_add() - add a new watcher
 * @param name watcher name (used to perform operation on the watcher)
 * @param scan_interval_sec scanning interval in seconds
 * @param project github project to scan
 */
export function watcher_add(
  name: string,
  scan_interval_sec: number,
  project: GithubProject
) {
  if (name in __watcher_dict)
    throw `unable to add the new watcher "${name}": already registered`
  __watcher_dict[name] = new __WatcherItem(name, scan_interval_sec, project)
  __watcher_dict[name].start()
  console.log('new watcher object added')
}

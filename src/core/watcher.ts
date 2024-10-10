//---
// core.watcher - timer abstraction
//---

import { discord_notification_commits } from './discord'
import { GithubProject } from './github'

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

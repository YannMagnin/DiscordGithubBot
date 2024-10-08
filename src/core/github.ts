//---
// core.github  - github abstraction
//---

// private

/**
 * __GithubAPI - Github API abstaction
 *
 * Since we use "unauthenticated users" requests, we cannot send more than 60
 * requests per hours. So we need to keep track of all request time to know
 * when we can interract with the service and to provide more information
 * concerning the cooldown
 */
class __GithubAPI {
  _request_history: any[] = []

  /**
   * commit_scan() - fetch all commit information since a timestamp
   * @param repo_uri - must be to the form '{owner}/{repo}'
   * @param since - must be the last scanned date (timestamp)
   */
  static commit_scan(repo_uri: string, since: number) {
    console.log(
      'request Github API for commit scanning for \n' +
        `-- ${repo_uri}\n` +
        `-- ${since}`
    )
  }
}

// public

export class GithubProject {
  name: string
  _last_commit_scan_timestamp: number

  constructor(name: string) {
    this.name = name
    this._last_commit_scan_timestamp = Date.now()
  }

  // public method

  check_new_commit() {
    console.log(`request commit scanning for '${this.name}'`)
  }
}

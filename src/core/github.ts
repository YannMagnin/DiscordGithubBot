//---
// core.github  - github abstraction
//---

// private

const __GITHUB_REQUEST_LIMIT = 60

/**
 * __GithubHistoryItem - internal Github history item dataclass
 */
class __GithubHistoryItem {
  timestamp: number
  target: string
  constructor(target: string) {
    this.timestamp = Date.now()
    this.target = target
  }
}

/**
 * __GithubAPI - Github API abstaction
 *
 * Since we use "unauthenticated users" requests, we cannot send more than 60
 * requests per hours. So we need to keep track of all request time to know
 * when we can interract with the service and to provide more information
 * concerning the cooldown
 */
class __GithubAPI {
  static _request_history: __GithubHistoryItem[] = []

  // private

  /**
   *  __history_update() - remove outdated history entry
   */
  static __history_update() {
    const current_timestamp = Date.now()
    for (const item of __GithubAPI._request_history) {
      if (((current_timestamp - item.timestamp) / 1000 / 60) < 60)
        continue
      console.log(`[history] remove outdated ${item.target}`)
      __GithubAPI._request_history.splice(
        __GithubAPI._request_history.indexOf(item)
      )
    }
  }

  /**
   * __allow_to_request() - ensure that we can perform a request to the API
   *
   * Keep track of the request history and ensure that we are in the 60 requests
   * range for the API interraction
   */
  static __history_allow_request(target: string) {
    __GithubAPI.__history_update()
    if (__GithubAPI._request_history.length < __GITHUB_REQUEST_LIMIT) {
      console.log('adding a new request to the history')
      __GithubAPI._request_history.push(new __GithubHistoryItem(target))
      return
    }
    const latest_request = __GithubAPI._request_history.at(-1)
    if (latest_request == undefined)
      throw 'internal error during history handling'
    const cooldown_delta = Date.now() - latest_request.timestamp
    const cooldown_min = Math.ceil(cooldown_delta / 1000)
    throw `too many requests performed, you need to wait ${cooldown_min} minute`
  }

  // public

  /**
   * commit_scan() - fetch all commit information since a timestamp
   * @param repo_uri - must be to the form '{owner}/{repo}'
   * @param since - must be the last scanned date (timestamp)
   */
  static commit_scan(repo_uri: string, since: number) {
    __GithubAPI.__history_allow_request('commits')
    console.log(
      'request Github API for commit scanning for \n' +
        `-- ${repo_uri}\n` +
        `-- ${since}`
    )
  }
}

// public

export class GithubProject {
  repo_uri: string
  _last_commit_scan_timestamp: number

  constructor(name: string) {
    this.repo_uri = name
    this._last_commit_scan_timestamp = Date.now()
  }

  // public method

  check_new_commit() {
    console.log(`request commit scanning for '${this.repo_uri}'`)
    __GithubAPI.commit_scan(this.repo_uri, this._last_commit_scan_timestamp)
  }
}

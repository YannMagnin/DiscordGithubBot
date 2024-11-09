//---
// core.github  - github abstraction
//---

// Workaround to allow temporary the use of `any` type to allow raw API
// manipulation without typing hell
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { config_get_raw } from './config'
import { discord_notification_send, DiscordEmbedBuilder } from './discord'

// private

const __GITHUB_REQUEST_LIMIT = 60
const __GITHUB_API_URL = 'https://api.github.com'
const __GITHUB_URL_REGEX = new RegExp(
  `^${__GITHUB_API_URL}/` +
    '(?<type>(repos|issues))/' +
    '(?<owner>[a-zA-Z0-9_]+)/' +
    '(?<project>[a-zA-Z0-9_]+)'
)

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
  static _api_token: string = ''

  // private

  /**
   * __api_request() - abstract the Github API requests
   * @param route - the API endpoint to request
   * @returns - the API data
   */
  static async __api_request(route: string) {
    console.log(`perform a Github API request at ${__GITHUB_API_URL}/${route}`)
    const response = await fetch(`${__GITHUB_API_URL}/${route}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${__GithubAPI._api_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!response.ok) {
      throw `Response status: ${response.status}`
    }
    console.log('success response !!')
    return await response.json()
  }

  /**
   *  __history_update() - remove outdated history entry
   */
  static __history_update() {
    const current_timestamp = Date.now()
    for (const item of __GithubAPI._request_history) {
      if ((current_timestamp - item.timestamp) / 1000 / 60 < 60) continue
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
  static async commit_scan(repo_uri: string, since_timestamp: number) {
    __GithubAPI.__history_allow_request('commits')
    const since = new Date(since_timestamp).toISOString()
    console.log(
      `request Github API for commit scanning for ${repo_uri} (${since})`
    )
    return await __GithubAPI.__api_request(
      `/repos/${repo_uri}/commits?since=${since}`
    )
  }
}

// public

/**
 * GithubCommit - Github commit dataclass
 */
export interface GithubCommit {
  sha: string
  author: string
  author_icon: string
  project: string
  url: string
  body: string
  branch: string
  verified: boolean
  signed: boolean
  date: string
  timestamp: number
}

/**
 * GithubProject - abstract a Github project to watch
 */
export class GithubProject {
  repo_uri: string
  last_commit_scan_timestamp: number

  // magics

  constructor(uri: string, last_commit_scan_timestamp: number) {
    this.repo_uri = uri
    this.last_commit_scan_timestamp = last_commit_scan_timestamp
  }

  // private method

  /**
   * __convert_commits_info() - convert received commit info into internal form
   */
  __convert_commits_info(project: string, commit: any): GithubCommit {
    const gcommit = {
      author: commit.commit.author.name,
      author_icon: commit.author.avatar_url,
      body: commit.commit.message,
      branch: 'master',
      project: project,
      sha: commit.sha,
      signed: commit.commit.verification.signature !== '',
      verified: commit.commit.verification.verified,
      url: commit.commit.url,
      date: commit.commit.author.date,
      timestamp: Date.parse(commit.commit.author.date),
    }
    gcommit.date = gcommit.date
      .substring(0, 19)
      .replaceAll('-', '/')
      .replaceAll('T', ' ')
    return gcommit
  }

  /**
   * __send_new_commit_notification() - send new commit notification
   * @param commit - github commit information
   */
  __send_new_commit_notification(commits: GithubCommit[]) {
    const embeds: DiscordEmbedBuilder[] = []
    for (const commit of commits) {
      const verified = commit.verified ? 'verified' : 'unverified'
      const signed = commit.signed ? 'signed' : 'unsigned'
      embeds.push(
        new DiscordEmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`[${commit.project}] 1 new commit`)
          .setAuthor({
            name: commit.author,
            iconURL: commit.author_icon,
            url: commit.url,
          })
          .setDescription(commit.body)
          .setURL(commit.url)
          .setFooter({
            text: `${commit.sha.substring(0, 7)} • ${verified} • ${signed} • ${
              commit.date
            }`,
          })
      )
    }
    discord_notification_send(embeds)
  }

  // public method

  /**
   * check_new_commits() - check new commit since a specific date
   * @returns - a list of all new commits information
   */
  async check_new_commits(): Promise<number> {
    console.log(`request commit scanning for '${this.repo_uri}'`)
    const commits = await __GithubAPI.commit_scan(
      this.repo_uri,
      this.last_commit_scan_timestamp
    )
    console.log(`received commits = ${commits}`)
    if (commits.length === 0) return 0
    const gcommits: GithubCommit[] = []
    for (const commit of commits) {
      console.log(`-- commit = ${commit}`)
      const query = __GITHUB_URL_REGEX.exec(commit.commit.url)?.groups
      if (query === undefined)
        throw `unsupported github URL '${commit.commit.url}'`
      gcommits.push(
        this.__convert_commits_info(`${query.owner}/${query.project}`, commit)
      )
    }
    gcommits.sort((a: GithubCommit, b: GithubCommit) => {
      if (a.timestamp < b.timestamp) return -1
      if (a.timestamp > b.timestamp) return 1
      return 0
    })
    this.last_commit_scan_timestamp = Date.now()
    this.__send_new_commit_notification(gcommits)
    return gcommits.length
  }
}

/**
 * github_init() - initialise github internals
 */
export function github_init() {
  const config = config_get_raw()
  if (!('github' in config))
    throw 'missing the critical github configuration section'
  for (const prop of ['token']) {
    if (!(prop in config.github))
      throw `missing critical \`${prop}\` property in the configuration file`
  }
  __GithubAPI._api_token = config.github.token
}

/**
 * github_generate_url() - generate the project URL
 * @returns - the prolect URL
 */
export function github_generate_url(uri: string): string {
  return `https://github.com/${uri}`
}

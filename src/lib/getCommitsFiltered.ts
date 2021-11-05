import debugFactory from 'debug'
import { relative } from 'path'
import gitLogParser, { Commit } from 'git-log-parser'
import execa from 'execa'
import getStream from 'get-stream'

import { ValueError, check } from './blork'
import cleanPath from './cleanPath'

const debug = debugFactory('msr:commitsFilter')

// Add correct fields to gitLogParser.
Object.assign(gitLogParser.fields, {
  hash: 'H',
  message: 'B',
  gitTags: 'd',
  committerDate: { key: 'ci', type: Date },
})

/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 * Commits are filtered to only return those that corresponding to the package directory.
 *
 * This is achieved by using "-- my/dir/path" with `git log` — passing this into gitLogParser() with
 *
 * @param  cwd Absolute path of the working directory the Git repo is in.
 * @param  dir Path to the target directory to filter by. Either absolute, or relative to cwd param.
 * @param  lastRelease The SHA of the previous release (default to start of all commits if undefined)
 * @param  nextRelease The SHA of the next release (default to HEAD if undefined)
 * @param  firstParentBranch first-parent to determine which merges went into master
 * @return The list of commits on the branch `branch` since the last release.
 */
export default async function getCommitsFiltered(
  cwd: string,
  dir: string,
  lastRelease?: string,
  nextRelease?: string,
  firstParentBranch?: string,
): Promise<Commit[]> {
  // Clean paths and make sure directories exist.
  check(cwd, 'cwd: directory')
  check(dir, 'dir: path')
  // eslint-disable-next-line no-param-reassign
  cwd = cleanPath(cwd)
  // eslint-disable-next-line no-param-reassign
  dir = cleanPath(dir, cwd)
  check(dir, 'dir: directory')
  check(lastRelease, 'lastRelease: alphanumeric{40}?')
  check(nextRelease, 'nextRelease: alphanumeric{40}?')

  // target must be inside and different than cwd.
  if (!dir.startsWith(cwd)) {
    throw new ValueError('dir: Must be inside cwd', dir)
  }
  if (dir === cwd) {
    throw new ValueError('dir: Must not be equal to cwd', dir)
  }

  // Get top-level Git directory as it might be higher up the tree than cwd.
  const root = (await execa('git', ['rev-parse', '--show-toplevel'], { cwd }))
    .stdout

  // Use git-log-parser to get the commits.
  const relpath = relative(root, dir)
  const firstParentBranchFilter = firstParentBranch
    ? ['--first-parent', firstParentBranch]
    : []
  const range =
    (lastRelease ? `${lastRelease}..` : '') + (nextRelease ?? 'HEAD')
  const gitLogFilterQuery = [...firstParentBranchFilter, range, '--', relpath]
  const stream = gitLogParser.parse(
    { _: gitLogFilterQuery },
    { cwd, env: process.env },
  )
  const commits = await getStream.array<Commit>(stream)

  // Trim message and tags.
  commits.forEach(commit => {
    // eslint-disable-next-line no-param-reassign
    commit.message = commit.message.trim()
    // eslint-disable-next-line no-param-reassign
    commit.gitTags = commit.gitTags.trim()
  })

  debug('git log filter query: %o', gitLogFilterQuery)
  debug('filtered commits: %O', commits)

  // Return the commits.
  return commits
}

/**
 * Lifted and tweaked from semantic-release because we follow how they test their internals.
 * https://github.com/semantic-release/semantic-release/blob/master/test/helpers/git-utils.js
 */

import { check } from 'blork'
import tempy from 'tempy'
import execa from 'execa'
import fileUrl from 'file-url'

/**
 * @typedef {Object} Commit
 * @property branch The commit branch.
 * @property hash The commit hash.
 * @property message The commit message.
 */

// Init.

/**
 * Create a Git repository.
 * _Created in a temp folder._
 *
 * @param branch="master" The branch to initialize the repository to.
 * @return Promise that resolves to string pointing to the CWD for the created Git repository.
 */
export function gitInit(branch = 'master'): string {
  // Check params.
  check(branch, 'branch: kebab')

  // Init Git in a temp directory.
  const cwd = tempy.directory()
  execa.sync('git', ['init'], { cwd })
  execa.sync('git', ['checkout', '-b', branch], { cwd })

  // Disable GPG signing for commits.
  gitConfig(cwd, 'commit.gpgsign', 'false')

  // Return directory.
  return cwd
}

/**
 * Create a remote Git repository.
 * _Created in a temp folder._
 *
 * @return Promise that resolves to string URL of the of the remote origin.
 */
export function gitInitRemote(): string {
  // Init bare Git repository in a temp directory.
  const cwd = tempy.directory()
  execa.sync('git', ['init', '--bare'], { cwd })

  // Turn remote path into a file URL.
  const url = fileUrl(cwd)

  // Return URL for remote.
  return url
}

/**
 * Create a remote Git repository and set it as the origin for a Git repository.
 * _Created in a temp folder._
 *
 * @param cwd The cwd to create and set the origin for.
 * @param releaseBranch="null" Optional branch to be added in case of prerelease is activated for a branch.
 * @return Promise that resolves to string URL of the of the remote origin.
 */
export function gitInitOrigin(cwd: string, releaseBranch?: string): string {
  // Check params.
  check(cwd, 'cwd: absolute')

  // Turn remote path into a file URL.
  const url = gitInitRemote()

  // Set origin on local repo.
  execa.sync('git', ['remote', 'add', 'origin', url], { cwd })

  // Set up a release branch. Return to master afterwards.
  if (releaseBranch) {
    execa.sync('git', ['checkout', '-b', releaseBranch], { cwd })
    execa.sync('git', ['checkout', 'master'], { cwd })
  }

  execa.sync('git', ['push', '--all', 'origin'], { cwd })

  // Return URL for remote.
  return url
}

// Add.

/**
 * Add files to staged commit in a Git repository.
 *
 * @param cwd The cwd to create and set the origin for.
 * @param file="." The file to add, defaulting to "." (all files).
 * @return Promise that resolves when done.
 */
export function gitAdd(cwd: string, file = '.') {
  // Check params.
  check(cwd, 'cwd: absolute')

  // Await command.
  execa.sync('git', ['add', file], { cwd })
}

// Commits.

/**
 * Create commit on a Git repository.
 * _Allows empty commits without any files added._
 *
 * @param cwd The CWD of the Git repository.
 * @param message Commit message.
 * @returns Promise that resolves to the SHA for the commit.
 */
export function gitCommit(cwd: string, message: string): string {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(message, 'message: string+')

  // Await the command.
  execa.sync('git', ['commit', '-m', message, '--no-gpg-sign'], { cwd })

  // Return HEAD SHA.
  return gitGetHead(cwd)
}

/**
 * `git add .` followed by `git commit`
 * _Allows empty commits without any files added._
 *
 * @param cwd The CWD of the Git repository.
 * @param message Commit message.
 * @returns Promise that resolves to the SHA for the commit.
 */
export function gitCommitAll(cwd: string, message: string): string {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(message, 'message: string+')

  // Await command.
  gitAdd(cwd)

  // Await command and return the SHA hash.
  return gitCommit(cwd, message)
}

// Push.

/**
 * Push to a remote Git repository.
 *
 * @param cwd The CWD of the Git repository.
 * @param remote The remote repository URL or name.
 * @param branch The branch to push.
 * @returns Promise that resolves when done.
 * @throws {Error} if the push failed.
 */
export function gitPush(cwd: string, remote = 'origin', branch = 'master') {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(remote, 'remote: string')
  check(branch, 'branch: lower')

  // Await command.
  execa.sync('git', ['push', '--tags', remote, `HEAD:${branch}`], { cwd })
}

// Branches.

/**
 * Create a branch in a local Git repository.
 *
 * @param cwd The CWD of the Git repository.
 * @param branch Branch name to create.
 * @returns Promise that resolves when done.
 */
export function gitBranch(cwd: string, branch: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(branch, 'branch: lower')

  // Await command.
  execa.sync('git', ['branch', branch], { cwd })
}

/**
 * Checkout a branch in a local Git repository.
 *
 * @param cwd The CWD of the Git repository.
 * @param branch Branch name to checkout.
 * @returns Promise that resolves when done.
 */
export function gitCheckout(cwd: string, branch: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(branch, 'branch: lower')

  // Await command.
  execa.sync('git', ['checkout', branch], { cwd })
}

// Hashes.

/**
 * Get the current HEAD SHA in a local Git repository.
 *
 * @param cwd The CWD of the Git repository.
 * @return Promise that resolves to the SHA of the head commit.
 */
export function gitGetHead(cwd: string) {
  // Check params.
  check(cwd, 'cwd: absolute')

  // Await command and return HEAD SHA.
  return execa.sync('git', ['rev-parse', 'HEAD'], { cwd }).stdout
}

// Tags.

/**
 * Create a tag on the HEAD commit in a local Git repository.
 *
 * @param cwd The CWD of the Git repository.
 * @param tagName The tag name to create.
 * @param hash=false SHA for the commit on which to create the tag. If falsy the tag is created on the latest commit.
 * @returns Promise that resolves when done.
 */
export function gitTag(cwd: string, tagName: string, hash?: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(tagName, 'tagName: string+')
  check(hash, 'hash: alphanumeric{40}?')

  // Run command.
  execa.sync('git', hash ? ['tag', '-f', tagName, hash] : ['tag', tagName], {
    cwd,
  })
}

/**
 * Get the tag associated with a commit SHA.
 *
 * @param cwd The CWD of the Git repository.
 * @param hash The commit SHA for which to retrieve the associated tag.
 * @return The tag associated with the SHA in parameter or `null`.
 */
export function gitGetTags(cwd: string, hash: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(hash, 'hash: alphanumeric{40}')

  // Run command.
  return execa.sync('git', ['describe', '--tags', '--exact-match', hash], {
    cwd,
  }).stdout
}

/**
 * Get the first commit SHA tagged `tagName` in a local Git repository.
 *
 * @param cwd The CWD of the Git repository.
 * @param tagName Tag name for which to retrieve the commit sha.
 * @return Promise that resolves to the SHA of the first commit associated with `tagName`.
 */
export function gitGetTagHash(cwd: string, tagName: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(tagName, 'tagName: string+')

  // Run command.
  return execa.sync('git', ['rev-list', '-1', tagName], { cwd }).stdout
}

// Configs.

/**
 * Add a Git config setting.
 *
 * @param cwd The CWD of the Git repository.
 * @param name Config name.
 * @param value Config value.
 * @returns Promise that resolves when done.
 */
export function gitConfig(cwd: string, name: string, value: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(name, 'name: string+')

  // Run command.
  execa.sync('git', ['config', '--add', name, value], { cwd })
}

/**
 * Get a Git config setting.
 *
 * @param cwd The CWD of the Git repository.
 * @param name Config name.
 * @returns Promise that resolves when done.
 */
export function gitGetConfig(cwd: string, name: string) {
  // Check params.
  check(cwd, 'cwd: absolute')
  check(name, 'name: string+')

  // Run command.
  return execa.sync('git', ['config', name], { cwd }).stdout
}

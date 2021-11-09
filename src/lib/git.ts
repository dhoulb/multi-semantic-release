import execa, { SyncOptions } from 'execa'

/**
 * Get all the tags for a given branch.
 *
 * @param branch The branch for which to retrieve the tags.
 * @param execaOptions Options to pass to `execa`.
 * @param filters List of prefixes/sufixes to be checked inside tags.
 *
 * @return List of git tags.
 * @throws {Error} If the `git` command fails.
 * @internal
 */
export function getTags(
  branch: string,
  execaOptions: SyncOptions = {},
  filters?: string[],
): string[] {
  const stringTags = execa.sync(
    'git',
    ['tag', '--merged', branch],
    execaOptions,
  ).stdout
  const tags = stringTags
    .split('\n')
    .map(tag => tag.trim())
    .filter(Boolean)

  if (filters == null || filters.length === 0) {
    return tags
  }

  const validateSubstr = (t: string, f: string[]) =>
    !!f.find(v => t.includes(v))

  return tags.filter(tag => validateSubstr(tag, filters))
}

/**
 * Get the commit sha for a given tag.
 *
 * @param tagName Tag name for which to retrieve the commit sha.
 * @param execaOptions Options to pass to `execa`.
 *
 * @return The commit sha of the tag in parameter or `null`.
 */
export async function getTagHead(
  tagName: string,
  execaOptions: SyncOptions = {},
): Promise<string> {
  return (await execa('git', ['rev-list', '-1', tagName], execaOptions)).stdout
}

/**
 * Lifted and tweaked from semantic-release because we follow how they bump their packages/dependencies.
 * https://github.com/semantic-release/semantic-release/blob/master/lib/utils.js
 */

import { SemVer, gt, lt, prerelease, rcompare } from 'semver'

/**
 * Get tag objects and convert them to a list of stringified versions.
 * @param tags Tags as object list.
 * @returns Tags as string list.
 * @internal
 */
export function tagsToVersions(tags: SemVer[] = []): string[] {
  return (tags ?? []).map(({ version }) => version)
}

/**
 * HOC that applies highest/lowest semver function.
 * @param predicate High order function to be called.
 * @param version1 Version 1 to be compared with.
 * @param version2 Version 2 to be compared with.
 * @returns Highest or lowest version.
 * @internal
 */
const _selectVersionBy = (
  predicate?: (str1: string, str2: string) => boolean,
  version1?: string,
  version2?: string,
): string | undefined => {
  if ((predicate != null) && version1 != null && version2 != null) {
    return predicate(version1, version2) ? version1 : version2
  }
  return version1 ?? version2
}

/**
 * Gets highest semver function binding gt to the HOC selectVersionBy.
 */
export const getHighestVersion = _selectVersionBy.bind(null, gt)

/**
 * Gets lowest semver function binding gt to the HOC selectVersionBy.
 */
export const getLowestVersion = _selectVersionBy.bind(null, lt)

/**
 * Retrieve the latest version from a list of versions.
 * @param versions Versions as string list.
 * @param withPrerelease Prerelease flag.
 * @returns Latest version.
 * @internal
 */
export function getLatestVersion(
  versions: string[],
  withPrerelease: boolean = false,
): string | undefined {
  return versions
    .filter(version => withPrerelease || (prerelease(version) == null))
    .sort(rcompare)[0]
}

/**
 * Check if a value is defined or not
 *
 * @param value
 * @returns
 */
export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}


/**
 * Check if a value is not null
 *
 * @param value
 * @returns
 */
 export function isNotNull<T>(value: T | null): value is T {
  return value !== null
}
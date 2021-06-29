import { writeFileSync } from 'fs'
import semver, { ReleaseType } from 'semver'
import debugFactory from 'debug'

import { Package } from '../typings'

import recognizeFormat from './recognizeFormat'
import getManifest from './getManifest'
import { getHighestVersion, getLatestVersion, isNotNull } from './utils'
import { getTags } from './git'

const debug = debugFactory('msr:updateDeps')

const getManifestDifference = (
  newManifest: Record<string, string> = {},
  oldManifest: Record<string, string> = {},
): Record<string, string> => {
  return Object.entries(newManifest).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value !== oldManifest[key]) {
        acc[key] = `${oldManifest[key]} → ${value}`
      }

      return acc
    },
    {},
  )
}

/**
 * Resolve next package version.
 *
 * @param pkg Package object.
 * @returns Next pkg version.
 * @internal
 */
export const getNextVersion = (pkg: Package): string => {
  const lastVersion = pkg._lastRelease?.version
  const defaultNextVersion = lastVersion ?? '1.0.0'

  if (!lastVersion || !pkg._nextType || typeof pkg._nextType !== 'string') {
    return defaultNextVersion
  }

  return semver.inc(lastVersion, pkg._nextType) ?? defaultNextVersion
}

/**
 * Resolve the package version from a tag
 *
 * @param pkg Package object.
 * @param tag The tag containing the version to resolve
 *
 * @returns The version of the package or null if no tag was passed
 * @internal
 */
export const getVersionFromTag = (
  pkg: Record<string, any>,
  tag?: string,
): string | null => {
  if (!pkg.name) {
    return tag ?? null
  }
  if (!tag) {
    return null
  }

  const strMatch = tag.match(/[0-9].[0-9].[0-9].*/)
  return strMatch?.[0] && semver.valid(strMatch[0]) ? strMatch[0] : null
}

/**
 * Parse the prerelease tag from a semver version.
 *
 * @param version Semver version in a string format.
 * @returns preReleaseTag Version prerelease tag or null.
 * @internal
 */
export const getPreReleaseTag = (version: string): string | null => {
  const parsed = semver.parse(version)
  if (parsed == null) {
    return null
  }
  return parsed.prerelease[0] ? String(parsed.prerelease[0]) : null
}

/**
 * Resolve next version of dependency.
 *
 * @param currentVersion Current dep version
 * @param nextVersion Next release type: patch, minor, major
 * @param strategy Resolution strategy: inherit, override, satisfy
 * @returns Next dependency version
 * @internal
 */
export const resolveNextVersion = (
  currentVersion: string,
  nextVersion: string,
  strategy: ReleaseType | 'inherit' | 'satisfy' | 'override' = 'override',
): string | undefined => {
  // Check the next pkg version against its current references.
  // If it matches (`*` matches to any, `1.1.0` matches `1.1.x`, `1.5.0` matches to `^1.0.0` and so on)
  // release will not be triggered, if not `override` strategy will be applied instead.
  if (
    (strategy === 'satisfy' || strategy === 'inherit') &&
    semver.satisfies(nextVersion, currentVersion)
  ) {
    return currentVersion
  }

  // `inherit` will try to follow the current declaration version/range.
  // `~1.0.0` + `minor` turns into `~1.1.0`, `1.x` + `major` gives `2.x`,
  // but `1.x` + `minor` gives `1.x` so there will be no release, etc.
  if (strategy === 'inherit') {
    const sep = '.'
    const nextChunks = nextVersion.split(sep)
    const currentChunks = currentVersion.split(sep)
    // prettier-ignore
    const resolvedChunks = currentChunks.map((chunk, i) =>
			nextChunks[i]
				? chunk.replace(/\d+/, nextChunks[i])
				: chunk
		);

    return resolvedChunks.join(sep)
  }

  // "override"
  // By default next package version would be set as is for the all dependants.
  return nextVersion
}

/**
 * Resolve next prerelease comparing bumped tags versions with last version.
 *
 * @param latestTag Last released tag from branch or null if non-existent.
 * @param lastVersion Last version released.
 * @param pkgPreRelease Prerelease tag from package to-be-released.
 * @returns Next pkg version.
 * @internal
 */
const _nextPreHighestVersion = (
  latestTag: string | undefined,
  lastVersion: string,
  pkgPreRelease: string,
): string | null | undefined => {
  const bumpFromTags = latestTag
    ? semver.inc(latestTag, 'prerelease', pkgPreRelease)
    : null
  const bumpFromLast = semver.inc(lastVersion, 'prerelease', pkgPreRelease)

  return bumpFromTags
    ? getHighestVersion(bumpFromLast ?? undefined, bumpFromTags)
    : bumpFromLast
}

/**
 * Resolve next prerelease special cases: highest version from tags or major/minor/patch.
 *
 * @param tags List of all released tags from package.
 * @param lastVersion Last package version released.
 * @param pkgNextType Next type evaluated for the next package type.
 * @param pkgPreRelease Package prerelease suffix.
 * @returns Next pkg version.
 * @internal
 */
const _nextPreVersionCases = (
  tags: string[],
  lastVersion: string,
  pkgNextType: ReleaseType,
  pkgPreRelease: string,
): string | undefined | null => {
  // Case 1: Normal release on last version and is now converted to a prerelease
  if (semver.prerelease(lastVersion) == null) {
    const semVerRes = semver.parse(lastVersion)
    if (semVerRes == null) {
      throw new Error('Can not parse the last version')
    }
    const { major, minor, patch } = semVerRes

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${semver.inc(
      `${major}.${minor}.${patch}`,
      pkgNextType || 'patch',
    )}-${pkgPreRelease}.1`
  }

  // Case 2: Validates version with tags
  const latestTag = getLatestVersion(tags, true)
  return _nextPreHighestVersion(latestTag, lastVersion, pkgPreRelease)
}

/**
 * Resolve next package version on prereleases.
 *
 * @param pkg Package object.
 * @param tags Override list of tags from specific pkg and branch.
 * @returns Next pkg version.
 * @internal
 */
export const getNextPreVersion = (
  pkg: Record<string, any>,
  tags?: string[],
): string | undefined => {
  const tagFilters = [pkg._preRelease]
  const lastVersion = pkg._lastRelease?.version
  // Extract tags:
  // 1. Set filter to extract only package tags
  // 2. Get tags from a branch considering the filters established
  // 3. Resolve the versions from the tags
  // TODO: replace {cwd: '.'} with multiContext.cwd
  if (pkg.name) {
    tagFilters.push(pkg.name)
  }
  if (tags == null || tags.length === 0) {
    // eslint-disable-next-line no-param-reassign
    tags = getTags(pkg._branch, { cwd: '.' }, tagFilters)
  }
  const lastPreRelTag = getPreReleaseTag(lastVersion)
  const isNewPreRelTag = lastPreRelTag && lastPreRelTag !== pkg._preRelease
  const versionToSet =
    isNewPreRelTag ?? !lastVersion
      ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `1.0.0-${pkg._preRelease}.1`
      : _nextPreVersionCases(
          tags.map(tag => getVersionFromTag(pkg, tag)).filter(isNotNull),
          lastVersion,
          pkg._nextType,
          pkg._preRelease,
        )

  return versionToSet ?? undefined
}

/**
 * Get dependent release type by recursive scanning and updating its deps.
 *
 * @param pkg The package with local deps to check.
 * @param bumpStrategy Dependency resolution strategy: override, satisfy, inherit.
 * @param releaseStrategy Release type triggered by deps updating: patch, minor, major, inherit.
 * @param ignore Packages to ignore (to prevent infinite loops).
 * @returns Returns the highest release type if found, undefined otherwise
 * @internal
 */
const getDependentRelease = (
  pkg: Package,
  bumpStrategy: string,
  releaseStrategy: ReleaseType | 'inherit',
  ignore: Package[],
): ReleaseType | undefined => {
  const severityOrder = ['patch', 'minor', 'major']
  const { localDeps, manifest = {} } = pkg
  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
    optionalDependencies = {},
  } = manifest
  const scopes = [
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies,
  ]
  const bumpDependency = (
    scope: Record<string, string | undefined>,
    name: string,
    nextVersion?: string,
  ): boolean => {
    const currentVersion = scope[name]
    if (!nextVersion || !currentVersion) {
      return false
    }

    const resolvedVersion = resolveNextVersion(
      currentVersion,
      nextVersion,
      releaseStrategy,
    )
    if (currentVersion !== resolvedVersion) {
      // eslint-disable-next-line no-param-reassign
      scope[name] = resolvedVersion
      return true
    }

    return false
  }

  return localDeps
    .filter((p: Package) => !ignore.includes(p))
    .reduce<ReleaseType | undefined>(
      (releaseType: ReleaseType | undefined, p: Package) => {
        const name = p.name

        // Has changed if...
        // 1. Any local dep package itself has changed
        // 2. Any local dep package has local deps that have changed.
        const nextType = resolveReleaseType(p, bumpStrategy, releaseStrategy, [
          ...ignore,
          ...localDeps,
        ])

        // Set the nextVersion fallback to the last local dependency package last version
        let nextVersion = p._lastRelease?.version

        // Update the nextVersion only if there is a next type to be bumped
        if (nextType) {
          nextVersion = p._preRelease ? getNextPreVersion(p) : getNextVersion(p)
        }
        const lastVersion = pkg._lastRelease?.version

        // 3. And this change should correspond to manifest updating rule.
        const requireRelease = scopes.reduce(
          (res, scope) => bumpDependency(scope, name, nextVersion) || res,
          !lastVersion,
        )

        return requireRelease &&
          severityOrder.indexOf(nextType as string) >
            severityOrder.indexOf(releaseType as string)
          ? nextType
          : releaseType
      },
      undefined,
    )
}

/**
 * Resolve package release type taking into account the cascading dependency update.
 *
 * @param pkg Package object.
 * @param bumpStrategy Dependency resolution strategy: override, satisfy, inherit.
 * @param releaseStrategy Release type triggered by deps updating: patch, minor, major, inherit.
 * @param ignore=[] Packages to ignore (to prevent infinite loops).
 * @returns Resolved release type.
 * @internal
 */
export function resolveReleaseType(
  pkg: Package,
  bumpStrategy = 'override',
  releaseStrategy: ReleaseType | 'inherit' = 'patch',
  ignore: Package[] = [], // pkg[]
): ReleaseType | undefined {
  // NOTE This fn also updates pkg deps, so it must be invoked anyway.
  const dependentReleaseType = getDependentRelease(
    pkg,
    bumpStrategy,
    releaseStrategy,
    ignore,
  )

  // Release type found by commitAnalyzer.
  if (pkg._nextType) {
    return pkg._nextType
  }

  if (!dependentReleaseType) {
    return undefined
  }

  // Define release type for dependent package if any of its deps changes.
  // `patch`, `minor`, `major` — strictly declare the release type that occurs when any dependency is updated.
  // `inherit` — applies the "highest" release of updated deps to the package.
  // For example, if any dep has a breaking change, `major` release will be applied to the all dependants up the chain.

  // eslint-disable-next-line no-param-reassign
  pkg._nextType =
    releaseStrategy === 'inherit' ? dependentReleaseType : releaseStrategy

  return pkg._nextType
}

/**
 * Clarify what exactly was changed in manifest file.
 * @param actualManifest manifest object
 * @param path manifest path
 * @returns has changed or not
 * @internal
 */
const auditManifestChanges = (
  actualManifest: Record<string, any>,
  path: string,
): boolean => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const debugPrefix = `[${actualManifest.name}]`
  const oldManifest = getManifest(path)
  const depScopes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ] as const

  const changes = depScopes.reduce<
    Record<
      | 'dependencies'
      | 'devDependencies'
      | 'peerDependencies'
      | 'optionalDependencies',
      Record<string, string>
    >
  >((res, scope) => {
    const diff = getManifestDifference(
      actualManifest[scope],
      oldManifest[scope] ?? {},
    )

    if (Object.keys(diff).length > 0) {
      res[scope] = diff
    }

    return res
  }, {} as any as Record<'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies', Record<string, string>>)

  debug(debugPrefix, 'package.json path=', path)

  if (Object.keys(changes).length > 0) {
    debug(debugPrefix, 'changes=', changes)
    return true
  }

  debug(debugPrefix, 'no deps changes')
  return false
}

/**
 * Update pkg deps.
 *
 * @param pkg The package this function is being called on.
 * @returns
 * @internal
 */
export const updateManifestDeps = (pkg: Package): void => {
  const { manifest, path } = pkg
  const { indent, trailingWhitespace } = recognizeFormat(manifest.__contents__)

  // Loop through localDeps to verify release consistency.
  pkg.localDeps.forEach(d => {
    // Get version of dependency.
    const release = d._nextRelease ?? d._lastRelease

    // Cannot establish version.
    if (!release || !release.version) {
      throw Error(
        `Cannot release because dependency ${d.name} has not been released`,
      )
    }
  })

  if (!auditManifestChanges(manifest, path)) {
    return
  }

  // Write package.json back out.
  writeFileSync(
    path,
    JSON.stringify(manifest, null, indent) + trailingWhitespace,
  )
}

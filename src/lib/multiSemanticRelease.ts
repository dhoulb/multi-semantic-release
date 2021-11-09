import { dirname } from 'path'
import semanticRelease, { Options } from 'semantic-release'
import { uniq } from 'lodash'
import { WriteStream } from 'tty'
import batchingToposort from 'batching-toposort'

import { BaseMultiContext, Flags, Package } from '../typings'

import { check } from './blork'
import getLogger from './getLogger'
import getConfig from './getConfig'
import getConfigSemantic from './getConfigSemantic'
import getManifest from './getManifest'
import cleanPath from './cleanPath'
import RescopedStream from './RescopedStream'
import createInlinePluginCreator from './createInlinePluginCreator'
import { isDefined } from './utils'

/**
 * Perform a multirelease.
 *
 * @param paths An array of paths to package.json files.
 * @param inputOptions An object containing semantic-release options.
 * @param settings An object containing: cwd, env, stdout, stderr (mainly for configuring tests).
 * @param flags Argv flags.
 * @returns Promise that resolves to a list of package objects with `result` property describing whether it released or not.
 */
export default async function multiSemanticRelease(
  paths: string[],
  inputOptions: Options = {},
  {
    cwd = process.cwd(),
    env = process.env as { [name: string]: string },
    stdout = process.stdout,
    stderr = process.stderr,
  } = {},
  flags: Flags = { deps: {} },
) {
  // Check params.
  check(paths, 'paths: string[]')
  check(cwd, 'cwd: directory')
  check(env, 'env: objectlike')
  check(stdout, 'stdout: stream')
  check(stderr, 'stderr: stream')
  // eslint-disable-next-line no-param-reassign
  cwd = cleanPath(cwd)

  // Start.
  const logger = getLogger({ stdout, stderr })
  logger.complete(`Started multirelease! Loading ${paths.length} packages...`)

  // Vars.
  const globalOptions = await getConfig(cwd)
  const multiContext: BaseMultiContext = {
    globalOptions,
    inputOptions,
    cwd,
    env,
    stdout,
    stderr,
    logger,
  }

  // Load packages from paths.
  const packages = await Promise.all(
    paths.map(async path => await getPackage(path, multiContext)),
  )
  packages.forEach(pkg => {
    // Once we load all the packages we can find their cross refs
    // Make a list of local dependencies.
    // Map dependency names (e.g. my-awesome-dep) to their actual package objects in the packages array.
    // eslint-disable-next-line no-param-reassign
    pkg.localDeps = uniq(
      pkg.deps.map(d => packages.find(p => d === p.name)).filter(isDefined),
    )

    logger.success(`Loaded package ${pkg.name}`)
  })

  logger.complete(`Queued ${packages.length} packages! Starting release...`)

  // Release all packages.
  const createInlinePlugin = createInlinePluginCreator(multiContext, flags)

  const pkgDag = packages.reduce<Record<string, string[]>>(
    (acc, pkg) => {
      pkg.localDeps.forEach(dep => acc[dep.name].push(pkg.name))
      return acc
    },
    packages.reduce((acc, pkg) => ({ ...acc, [pkg.name]: [] }), {}),
  )

  try {
    const batches = batchingToposort(pkgDag)
    for (const batch of batches) {
      for (const pkgName of batch) {
        const pkg = packages.find(_pkg => _pkg.name === pkgName)
        if (!pkg) {
          throw new Error(`Inexistant package ${pkgName} in batch`)
        }

        await releasePackage(pkg, createInlinePlugin, multiContext, flags)
      }
    }

    const released = packages.filter(pkg => pkg.result).length

    // Return packages list.
    logger.complete(
      `Released ${released} of ${packages.length} packages, semantically!`,
    )
    return packages
  } catch (err: any) {
    if (err.message?.startsWith('Cycle(s) detected;')) {
      throw new Error('Cycle has been detected in local dependencies.')
    }

    throw err
  }
}

/**
 * Load details about a package.
 *
 * @param path The path to load details about.
 * @param allOptions Options that apply to all packages.
 * @param multiContext Context object for the multirelease.
 * @returns>} A package object, or void if the package was skipped.
 *
 * @internal
 */
async function getPackage(
  path: string,
  {
    globalOptions,
    inputOptions,
    env,
    cwd,
    stdout,
    stderr,
  }: Record<string, any>, // Options
): Promise<Package> {
  // Make path absolute.
  // eslint-disable-next-line no-param-reassign
  path = cleanPath(path, cwd)
  const dir = dirname(path)

  // Get package.json file contents.
  const manifest = getManifest(path)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const name = manifest.name!

  // Combine list of all dependency names.
  const deps = Object.keys({
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
    ...manifest.optionalDependencies,
  })

  // Load the package-specific options.
  const pkgOptions = await getConfig(dir)

  // The 'final options' are the global options merged with package-specific options.
  // We merge this ourselves because package-specific options can override global options.
  const finalOptions = Object.assign(
    {},
    globalOptions,
    pkgOptions,
    inputOptions,
  )

  // Make a fake logger so semantic-release's get-config doesn't fail.
  const logger = { error() {}, log() {} }

  // Use semantic-release's internal config (now we have the right `options.plugins` setting) to get the plugins object and the package options including defaults.
  // We need this so we can call e.g. plugins.analyzeCommit() to be able to affect the input and output of the whole set of plugins.
  const { options, plugins } = await getConfigSemantic(
    { cwd: dir, env, stdout, stderr, logger, globalOptions, inputOptions },
    finalOptions,
  )

  // Return package object.
  return {
    path,
    dir,
    name,
    manifest,
    deps,
    options,
    plugins,
    loggerRef: logger,
    localDeps: [],
  }
}

/**
 * Release an individual package.
 *
 * @param pkg The specific package.
 * @param createInlinePlugin A function that creates an inline plugin.
 * @param multiContext Context object for the multirelease.
 * @param flags Argv flags.
 * @returns Promise that resolves when done.
 *
 * @internal
 */
async function releasePackage(
  pkg: Package,
  createInlinePlugin: ReturnType<typeof createInlinePluginCreator>,
  multiContext: BaseMultiContext,
  flags: Flags,
) {
  // Vars.
  const { options: pkgOptions, name, dir } = pkg
  const { env, stdout, stderr } = multiContext

  // Make an 'inline plugin' for this package.
  // The inline plugin is the only plugin we call semanticRelease() with.
  // The inline plugin functions then call e.g. plugins.analyzeCommits() manually and sometimes manipulate the responses.
  const inlinePlugin = createInlinePlugin(pkg)

  // Set the options that we call semanticRelease() with.
  // This consists of:
  // - The global options (e.g. from the top level package.json)
  // - The package options (e.g. from the specific package's package.json)
  const options = { ...flags, ...pkgOptions, ...inlinePlugin }

  // Add the package name into tagFormat.
  // Thought about doing a single release for the tag (merging several packages), but it's impossible to prevent Github releasing while allowing NPM to continue.
  // It'd also be difficult to merge all the assets into one release without full editing/overriding the plugins.
  options.tagFormat = `${name}@\${version}`

  // This options are needed for plugins that do not rely on `pluginOptions` and extract them independently.
  options._pkgOptions = pkgOptions

  // Call semanticRelease() on the directory and save result to pkg.
  // Don't need to log out errors as semantic-release already does that.
  // eslint-disable-next-line no-param-reassign
  pkg.result = await semanticRelease(options, {
    cwd: dir,
    env,
    stdout: new RescopedStream(stdout, name) as any as WriteStream,
    stderr: new RescopedStream(stderr, name) as any as WriteStream,
  })
}

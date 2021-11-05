/* eslint-disable no-param-reassign */
import debugFactory from 'debug'
import { Config, Context } from 'semantic-release'

import {
  AnalyzeCommitsContext,
  BaseMultiContext,
  Flags,
  Package,
  PluginOption,
  VerifyConditionsContext,
} from '../typings'

import getCommitsFiltered from './getCommitsFiltered'
import { getTagHead } from './git'
import { resolveReleaseType, updateManifestDeps } from './updateDeps'

const debug = debugFactory('msr:inlinePlugin')

/**
 * Create an inline plugin creator for a multirelease.
 * This is caused once per multirelease and returns a function which should be called once per package within the release.
 *
 * @param {Package[]} packages The multi-semantic-release context.
 * @param {MultiContext} multiContext The multi-semantic-release context.
 * @param {Synchronizer} synchronizer Shared synchronization assets
 * @param {Object} flags argv options
 * @returns {Function} A function that creates an inline package.
 *
 * @internal
 */
export default function createInlinePluginCreator(
  multiContext: BaseMultiContext,
  synchronizer: Record<string, any>,
  flags: Flags,
) {
  // Vars.
  const { cwd } = multiContext
  const { todo, waitFor, waitForAll, emit, getLucky } = synchronizer

  /**
   * Create an inline plugin for an individual package in a multirelease.
   * This is called once per package and returns the inline plugin used for semanticRelease()
   *
   * @param {Package} pkg The package this function is being called on.
   * @returns {Object} A semantic-release inline plugin containing plugin step functions.
   *
   * @internal
   */
  function createInlinePlugin(pkg: Package) {
    // Vars.
    const { plugins, dir, name } = pkg
    const next = () => {
      pkg._tagged = true

      emit(
        '_readyForTagging',
        todo().find((p: Package) => p._nextType !== undefined && !p._tagged),
      )
    }

    /**
     * @param {object} pluginOptions Options to configure this plugin.
     * @param {object} context The semantic-release context.
     * @returns {Promise<void>} void
     * @internal
     */
    const verifyConditions = async (
      pluginOptions: PluginOption,
      context: VerifyConditionsContext,
    ) => {
      // Restore context for plugins that does not rely on parsed opts.
      Object.assign(context.options, context.options?._pkgOptions)

      // And bind actual logger.
      Object.assign(pkg.loggerRef, context.logger)

      pkg._ready = true
      emit(
        '_readyForRelease',
        todo().find((p: Package) => !p._ready),
      )

      const res = await plugins.verifyConditions(context) // Semantic release don't expose methods in their types

      debug('verified conditions: %s', pkg.name)

      return res
    }

    /**
     * Analyze commits step.
     * Responsible for determining the type of the next release (major, minor or patch). If multiple plugins with a analyzeCommits step are defined, the release type will be the highest one among plugins output.
     *
     * In multirelease: Returns "patch" if the package contains references to other local packages that have changed, or null if this package references no local packages or they have not changed.
     * Also updates the `context.commits` setting with one returned from `getCommitsFiltered()` (which is filtered by package directory).
     *
     * @param {object} pluginOptions Options to configure this plugin.
     * @param {object} context The semantic-release context.
     * @returns {Promise<void>} Promise that resolves when done.
     *
     * @internal
     */
    const analyzeCommits = async (
      pluginOptions: Config,
      context: AnalyzeCommitsContext,
    ) => {
      pkg._preRelease = context.branch.prerelease ?? null
      pkg._branch = context.branch.name

      // Filter commits by directory.
      const firstParentBranch = flags.firstParent
        ? context.branch.name
        : undefined
      const commits = await getCommitsFiltered(
        cwd,
        dir,
        (context.lastRelease != null) ? context.lastRelease.gitHead : undefined,
        (context.nextRelease != null) ? context.nextRelease.gitHead : undefined,
        firstParentBranch,
      )

      // Set context.commits so analyzeCommits does correct analysis.
      context.commits = commits

      // Set lastRelease for package from context.
      pkg._lastRelease = context.lastRelease

      // Set nextType for package from plugins.
      pkg._nextType = await plugins.analyzeCommits(context)

      // Wait until all todo packages have been analyzed.
      pkg._analyzed = true
      await waitForAll('_analyzed')

      // Make sure type is "patch" if the package has any deps that have changed.
      pkg._nextType = resolveReleaseType(
        pkg,
        flags.deps?.bump,
        flags.deps?.release,
      )

      debug('commits analyzed: %s', pkg.name)
      debug('release type: %s', pkg._nextType)

      // Return type.
      return pkg._nextType
    }

    /**
     * Generate notes step (after).
     * Responsible for generating the content of the release note. If multiple plugins with a generateNotes step are defined, the release notes will be the result of the concatenation of each plugin output.
     *
     * In multirelease: Edit the H2 to insert the package name and add an upgrades section to the note.
     * We want this at the _end_ of the release note which is why it's stored in steps-after.
     *
     * Should look like:
     *
     *     ## my-amazing-package [9.2.1](github.com/etc) 2018-12-01
     *
     *     ### Features
     *
     *     * etc
     *
     *     ### Dependencies
     *
     *     * **my-amazing-plugin:** upgraded to 1.2.3
     *     * **my-other-plugin:** upgraded to 4.9.6
     *
     * @param {object} pluginOptions Options to configure this plugin.
     * @param {object} context The semantic-release context.
     * @returns {Promise<void>} Promise that resolves to the string
     *
     * @internal
     */
    const generateNotes = async (
      pluginOptions: Config,
      context: AnalyzeCommitsContext,
    ) => {
      // Set nextRelease for package.
      pkg._nextRelease = context.nextRelease

      // Wait until all todo packages are ready to generate notes.
      await waitForAll('_nextRelease', (p: Package) => p._nextType)

      // Vars.
      const notes = []

      // get SHA of lastRelease if not already there (should have been done by Semantic Release...)
      if (
        context.lastRelease?.gitTag &&
        (!context.lastRelease.gitHead ||
          context.lastRelease.gitHead === context.lastRelease.gitTag)
      ) {
        context.lastRelease.gitHead = await getTagHead(
          context.lastRelease.gitTag,
          {
            cwd: context.options?.cwd,
            env: context.env,
          },
        )
      }

      // Filter commits by directory (and release range)
      const firstParentBranch = flags.firstParent
        ? context.branch.name
        : undefined
      const commits = await getCommitsFiltered(
        cwd,
        dir,
        (context.lastRelease != null) ? context.lastRelease.gitHead : undefined,
        (context.nextRelease != null) ? context.nextRelease.gitHead : undefined,
        firstParentBranch,
      )

      // Set context.commits so generateNotes does correct analysis.
      context.commits = commits

      // Get subnotes and add to list.
      // Inject pkg name into title if it matches e.g. `# 1.0.0` or `## [1.0.1]` (as generate-release-notes does).
      const subs = await plugins.generateNotes(context)
      // istanbul ignore else (unnecessary to test)
      if (subs) {
        notes.push(subs.replace(/^(#+) (\[?\d+\.\d+\.\d+\]?)/, `$1 ${name} $2`))
      }

      // If it has upgrades add an upgrades section.
      const upgrades = pkg.localDeps.filter((d: Package) => d._nextRelease)
      if (upgrades.length > 0) {
        notes.push(`### Dependencies`)
        const bullets = upgrades.map(
          (d: Package) =>
            `* **${d.name}:** upgraded to ${d._nextRelease?.version ?? ''}`,
        )
        notes.push(bullets.join('\n'))
      }

      debug('notes generated: %s', pkg.name)

      if (pkg.options.dryRun) {
        next()
      }

      // Return the notes.
      return notes.join('\n\n')
    }

    const prepare = async (pluginOptions: Config, context: Context) => {
      // Wait until the current pkg is ready to be tagged
      getLucky('_readyForTagging', pkg)
      await waitFor('_readyForTagging', pkg)

      updateManifestDeps(pkg)
      pkg._depsUpdated = true

      const res = await plugins.prepare(context)
      pkg._prepared = true

      debug('prepared: %s', pkg.name)

      return res
    }

    const publish = async (pluginOptions: Config, context: Context) => {
      next()

      const res = await plugins.publish(context)
      pkg._published = true

      debug('published: %s', pkg.name)

      // istanbul ignore next
      return res.length ? res[0] : {}
    }

    const inlinePlugin = {
      verifyConditions,
      analyzeCommits,
      generateNotes,
      prepare,
      publish,
    }

    // Add labels for logs.
    Object.keys(inlinePlugin).forEach(type =>
      Reflect.defineProperty(
        inlinePlugin[type as keyof typeof inlinePlugin],
        'pluginName',
        {
          value: 'Inline plugin',
          writable: false,
          enumerable: true,
        },
      ),
    )

    debug('inlinePlugin created: %s', pkg.name)

    return inlinePlugin
  }

  // Return creator function.
  return createInlinePlugin
}

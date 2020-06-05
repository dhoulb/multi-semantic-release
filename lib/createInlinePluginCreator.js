const { writeFileSync } = require("fs");
const { identity } = require("lodash");
const EventEmitter = require("promise-events");
const getCommitsFiltered = require("./getCommitsFiltered");
const getManifest = require("./getManifest");
const hasChangedDeep = require("./hasChangedDeep");

/**
 * Create an inline plugin creator for a multirelease.
 * This is caused once per multirelease and returns a function which should be called once per package within the release.
 *
 * @param {Package[]} packages The multi-semantic-release context.
 * @param {MultiContext} multiContext The multi-semantic-release context.
 * @returns {Function} A function that creates an inline package.
 *
 * @internal
 */
function createInlinePluginCreator(packages, multiContext) {
	// Vars.
	const { cwd } = multiContext;

	// List of packages which are still todo (don't yet have a result).
	const todo = () => packages.filter((p) => p.result === undefined);

	// Shared signal bus.
	const ee = new EventEmitter();

	// Announcement of readiness for release.
	todo().forEach((p) => (p._readyForRelease = ee.once(p.name)));

	// Status sync point.
	const waitFor = (prop, filter = identity) => {
		const promise = ee.once(prop);

		if (
			todo()
				.filter(filter)
				.every((p) => p.hasOwnProperty(prop))
		) {
			ee.emit(prop);
		}

		return promise;
	};

	/**
	 * Update pkg deps.
	 * @param {Package} pkg The package this function is being called on.
	 * @param {string} path Path to package.json file
	 * @returns {undefined}
	 * @internal
	 */
	const updateManifestDeps = (pkg, path) => {
		// Get and parse manifest file contents.
		const manifest = getManifest(path);

		// Loop through localDeps to update dependencies/devDependencies/peerDependencies in manifest.
		pkg._localDeps.forEach((d) => {
			// Get version of dependency.
			const release = d._nextRelease || d._lastRelease;

			// Cannot establish version.
			if (!release || !release.version)
				throw Error(`Cannot release because dependency ${d.name} has not been released`);

			// Update version of dependency in manifest.
			if (manifest.dependencies.hasOwnProperty(d.name)) manifest.dependencies[d.name] = release.version;
			if (manifest.devDependencies.hasOwnProperty(d.name)) manifest.devDependencies[d.name] = release.version;
			if (manifest.peerDependencies.hasOwnProperty(d.name)) manifest.peerDependencies[d.name] = release.version;
		});

		// Write package.json back out.
		writeFileSync(path, JSON.stringify(manifest));
	};

	/**
	 * Create an inline plugin for an individual package in a multirelease.
	 * This is called once per package and returns the inline plugin used for semanticRelease()
	 *
	 * @param {Package} pkg The package this function is being called on.
	 * @returns {Object} A semantic-release inline plugin containing plugin step functions.
	 *
	 * @internal
	 */
	function createInlinePlugin(pkg) {
		// Vars.
		const { deps, plugins, dir, path, name } = pkg;

		/**
		 * @var {Commit[]} List of _filtered_ commits that only apply to this package.
		 */
		let commits;

		/**
		 * @param {object} pluginOptions Options to configure this plugin.
		 * @param {object} context The semantic-release context.
		 * @returns {Promise<void>} void
		 * @internal
		 */
		const verifyConditions = async (pluginOptions, context) => {
			// Restore context for plugins that does not rely on parsed opts.
			Object.assign(context.options, context.options._pkgOptions);

			// And bind actual logger.
			Object.assign(pkg.loggerRef, context.logger);

			return plugins.verifyConditions(context);
		};

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
		const analyzeCommits = async (pluginOptions, context) => {
			// Filter commits by directory.
			commits = await getCommitsFiltered(cwd, dir, context.lastRelease.gitHead);

			// Set context.commits so analyzeCommits does correct analysis.
			context.commits = commits;

			// Set lastRelease for package from context.
			pkg._lastRelease = context.lastRelease;

			// Make a list of local dependencies.
			// Map dependency names (e.g. my-awesome-dep) to their actual package objects in the packages array.
			pkg._localDeps = deps.map((d) => packages.find((p) => d === p.name)).filter(Boolean);

			// Set nextType for package from plugins.
			pkg._nextType = await plugins.analyzeCommits(context);

			// Wait until all todo packages have been analyzed.
			pkg._analyzed = true;
			await waitFor("_analyzed");

			// Make sure type is "patch" if the package has any deps that have changed.
			if (!pkg._nextType && hasChangedDeep(pkg._localDeps)) pkg._nextType = "patch";

			// Return type.
			return pkg._nextType;
		};

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
		const generateNotes = async (pluginOptions, context) => {
			// Set nextRelease for package.
			pkg._nextRelease = context.nextRelease;

			// Wait until all todo packages are ready to generate notes.
			await waitFor("_nextRelease", (p) => p._nextType);

			if (todo()[0] !== pkg) {
				await pkg._readyForRelease;
			}

			// Update pkg deps.
			updateManifestDeps(pkg, path);
			pkg._depsUpdated = true;

			// Vars.
			const notes = [];

			// Set context.commits so analyzeCommits does correct analysis.
			// We need to redo this because context is a different instance each time.
			context.commits = commits;

			// Get subnotes and add to list.
			// Inject pkg name into title if it matches e.g. `# 1.0.0` or `## [1.0.1]` (as generate-release-notes does).
			const subs = await plugins.generateNotes(context);
			// istanbul ignore else (unnecessary to test)
			if (subs) notes.push(subs.replace(/^(#+) (\[?\d+\.\d+\.\d+\]?)/, `$1 ${name} $2`));

			// If it has upgrades add an upgrades section.
			const upgrades = pkg._localDeps.filter((d) => d._nextRelease);
			if (upgrades.length) {
				notes.push(`### Dependencies`);
				const bullets = upgrades.map((d) => `* **${d.name}:** upgraded to ${d._nextRelease.version}`);
				notes.push(bullets.join("\n"));
			}

			// Return the notes.
			return notes.join("\n\n");
		};

		const publish = async (pluginOptions, context) => {
			pkg._prepared = true;
			const nextPkgToProcess = todo().find((p) => p._nextType && !p._prepared);

			if (nextPkgToProcess) {
				ee.emit(nextPkgToProcess.name);
			}

			// Wait for all packages to be `prepare`d and tagged by `semantic-release`
			await waitFor("_prepared", (p) => p._nextType);

			const res = await plugins.publish(context);

			// istanbul ignore next
			return res.length ? res[0] : {};
		};

		const inlinePlugin = {
			verifyConditions,
			analyzeCommits,
			generateNotes,
			publish,
		};

		// Add labels for logs.
		Object.keys(inlinePlugin).forEach((type) =>
			Reflect.defineProperty(inlinePlugin[type], "pluginName", {
				value: "Inline plugin",
				writable: false,
				enumerable: true,
			})
		);

		return inlinePlugin;
	}

	// Return creator function.
	return createInlinePlugin;
}

// Exports.
module.exports = createInlinePluginCreator;

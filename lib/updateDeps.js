const { writeFileSync } = require("fs");
const recognizeFormat = require("./recognizeFormat");
const semver = require("semver");

/**
 * Resolve next package version.
 *
 * @param {Package} pkg Package object.
 * @returns {string|undefined} Next pkg version.
 * @internal
 */
const getNextVersion = (pkg) => {
	const lastVersion = pkg._lastRelease && pkg._lastRelease.version;

	return lastVersion && typeof pkg._nextType === "string"
		? semver.inc(lastVersion, pkg._nextType)
		: lastVersion || "1.0.0";
};

/**
 * Resolve next package version on prereleases.
 *
 * @param {Package} pkg Package object.
 * @returns {string|undefined} Next pkg version.
 * @internal
 */
const getNextPreVersion = (pkg) => {
	const lastVersion = pkg._lastRelease && pkg._lastRelease.version;

	return lastVersion ? semver.inc(lastVersion, "prerelease", pkg._preRelease) : `1.0.0-${pkg._preRelease}.1`;
};

/**
 * Resolve package release type taking into account the cascading dependency update.
 *
 * @param {Package} pkg Package object.
 * @param {string|undefined} bumpStrategy Dependency resolution strategy: override, satisfy, inherit.
 * @param {string|undefined} releaseStrategy Release type triggered by deps updating: patch, minor, major, inherit.
 * @param {Package[]} ignore=[] Packages to ignore (to prevent infinite loops).
 * @returns {string|undefined} Resolved release type.
 * @internal
 */
const resolveReleaseType = (pkg, bumpStrategy = "override", releaseStrategy = "patch", ignore = []) => {
	// NOTE This fn also updates pkg deps, so it must be invoked anyway.
	const dependentReleaseType = getDependentRelease(pkg, bumpStrategy, releaseStrategy, ignore);

	// Release type found by commitAnalyzer.
	if (pkg._nextType) {
		return pkg._nextType;
	}

	if (!dependentReleaseType) {
		return undefined;
	}

	// Define release type for dependent package if any of its deps changes.
	// `patch`, `minor`, `major` — strictly declare the release type that occurs when any dependency is updated.
	// `inherit` — applies the "highest" release of updated deps to the package.
	// For example, if any dep has a breaking change, `major` release will be applied to the all dependants up the chain.

	pkg._nextType = releaseStrategy === "inherit" ? dependentReleaseType : releaseStrategy;

	return pkg._nextType;
};

/**
 * Get dependent release type by recursive scanning and updating its deps.
 *
 * @param {Package} pkg The package with local deps to check.
 * @param {string} bumpStrategy Dependency resolution strategy: override, satisfy, inherit.
 * @param {string} releaseStrategy Release type triggered by deps updating: patch, minor, major, inherit.
 * @param {Package[]} ignore Packages to ignore (to prevent infinite loops).
 * @returns {string|undefined} Returns the highest release type if found, undefined otherwise
 * @internal
 */
const getDependentRelease = (pkg, bumpStrategy, releaseStrategy, ignore) => {
	const severityOrder = ["patch", "minor", "major"];
	const { localDeps, manifest = {} } = pkg;
	const { dependencies = {}, devDependencies = {}, peerDependencies = {}, optionalDependencies = {} } = manifest;
	const scopes = [dependencies, devDependencies, peerDependencies, optionalDependencies];
	const bumpDependency = (scope, name, nextVersion) => {
		const currentVersion = scope[name];
		if (!nextVersion || !currentVersion) {
			return false;
		}

		const resolvedVersion = resolveNextVersion(currentVersion, nextVersion, releaseStrategy);
		if (currentVersion !== resolvedVersion) {
			scope[name] = resolvedVersion;
			return true;
		}

		return false;
	};

	// prettier-ignore
	return localDeps
		.filter((p) => !ignore.includes(p))
		.reduce((releaseType, p) => {
			const name = p.name;

			// Has changed if...
			// 1. Any local dep package itself has changed
			// 2. Any local dep package has local deps that have changed.
			const nextType = resolveReleaseType(p, bumpStrategy, releaseStrategy,[...ignore, ...localDeps]);
			
			// Set the nextVersion fallback to the last local dependency package last version
			let nextVersion = p._lastRelease && p._lastRelease.version;

			// Update the nextVersion only if there is a next type to be bumped
			if (nextType) nextVersion = p._preRelease ? getNextPreVersion(p) : getNextVersion(p);
			const lastVersion = pkg._lastRelease && pkg._lastRelease.version;

			// 3. And this change should correspond to manifest updating rule.
			const requireRelease = scopes
				.reduce((res, scope) => bumpDependency(scope, name, nextVersion) || res, !lastVersion)

			return requireRelease && (severityOrder.indexOf(nextType) > severityOrder.indexOf(releaseType))
				? nextType
				: releaseType;
		}, undefined);
};

/**
 * Resolve next version of dependency.
 *
 * @param {string} currentVersion Current dep version
 * @param {string} nextVersion Next release type: patch, minor, major
 * @param {string|undefined} strategy Resolution strategy: inherit, override, satisfy
 * @returns {string} Next dependency version
 * @internal
 */
const resolveNextVersion = (currentVersion, nextVersion, strategy = "override") => {
	// Check the next pkg version against its current references.
	// If it matches (`*` matches to any, `1.1.0` matches `1.1.x`, `1.5.0` matches to `^1.0.0` and so on)
	// release will not be triggered, if not `override` strategy will be applied instead.
	if ((strategy === "satisfy" || strategy === "inherit") && semver.satisfies(nextVersion, currentVersion)) {
		return currentVersion;
	}

	// `inherit` will try to follow the current declaration version/range.
	// `~1.0.0` + `minor` turns into `~1.1.0`, `1.x` + `major` gives `2.x`,
	// but `1.x` + `minor` gives `1.x` so there will be no release, etc.
	if (strategy === "inherit") {
		const sep = ".";
		const nextChunks = nextVersion.split(sep);
		const currentChunks = currentVersion.split(sep);
		// prettier-ignore
		const resolvedChunks = currentChunks.map((chunk, i) =>
			nextChunks[i]
				? chunk.replace(/\d+/, nextChunks[i])
				: chunk
		);

		return resolvedChunks.join(sep);
	}

	// "override"
	// By default next package version would be set as is for the all dependants.
	return nextVersion;
};

/**
 * Update pkg deps.
 *
 * @param {Package} pkg The package this function is being called on.
 * @returns {undefined}
 * @internal
 */
const updateManifestDeps = (pkg) => {
	const { manifest, path } = pkg;
	const { indent, trailingWhitespace } = recognizeFormat(manifest.__contents__);

	// Loop through localDeps to verify release consistency.
	pkg.localDeps.forEach((d) => {
		// Get version of dependency.
		const release = d._nextRelease || d._lastRelease;

		// Cannot establish version.
		if (!release || !release.version)
			throw Error(`Cannot release because dependency ${d.name} has not been released`);
	});

	// Write package.json back out.
	writeFileSync(path, JSON.stringify(manifest, null, indent) + trailingWhitespace);
};

module.exports = {
	getNextVersion,
	getNextPreVersion,
	updateManifestDeps,
	resolveReleaseType,
	resolveNextVersion,
};

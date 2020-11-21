const { writeFileSync } = require("fs");
const recognizeFormat = require("./recognizeFormat");
const semver = require("semver");
const getManifest = require("./getManifest");

/**
 * Resolve next package version.
 *
 * @param {Package} pkg Package object.
 * @returns {string|undefined} Next pkg version.
 * @internal
 */
const getNextVersion = (pkg) => {
	const lastVersion = pkg._lastRelease && pkg._lastRelease.version;

	return lastVersion && typeof pkg._nextType === "string" ? semver.inc(lastVersion, pkg._nextType) : "1.0.0";
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
			return;
		}
		const resolvedVersion = resolveNextVersion(currentVersion, nextVersion, releaseStrategy);

		if (currentVersion !== resolvedVersion) {
			scope[name] = resolvedVersion;

			return true;
		}
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
			const nextVersion = getNextVersion(p);
			const lastVersion = pkg._lastRelease && pkg._lastRelease.version;

			// 3. And this change should correspond to manifest updating rule.
			const requireRelease = [
				...scopes.map((scope) => bumpDependency(scope, name, nextVersion)),
			].some(v => v) || !lastVersion;

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
	if (strategy === "satisfy" && semver.satisfies(nextVersion, currentVersion)) {
		return currentVersion;
	}

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

	// By default next package version would be set as is for the all dependants
	return nextVersion;
};

/**
 * Update pkg deps.
 *
 * @param {Package} pkg The package this function is being called on.
 * @param {string} strategy Dependency version updating rule
 * @returns {undefined}
 * @internal
 */
const updateManifestDeps = (pkg) => {
	const { manifest, path } = pkg;
	const { indent, trailingWhitespace } = recognizeFormat(manifest.__contents__);

	// NOTE npm plugin updates pkg version, so we have to sync.
	manifest.version = getManifest(path).version;

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
	updateManifestDeps,
	resolveReleaseType,
	resolveNextVersion,
};

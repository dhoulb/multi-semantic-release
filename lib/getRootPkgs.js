const { isArray, isPlainObject, isNil } = require("lodash");
const getManifest = require("./getManifest");
const cleanPath = require("./cleanPath");

/**
 * Return all the 'pkgRoot' options from plugins.
 *
 * This option primarily comes from the `@semantic-release/npm` plugin and represents the directory path to publish.
 * @see https://github.com/semantic-release/npm#options
 *
 * @param {MultiContext} context The multi-semantic-release context.
 * @returns {string[]} An array containing all the pkgRoot options (if any) or an empty array otherwise.
 *
 * @internal
 */
function getPkgRootOptions(context) {
	// Get a list of all the currently loaded plugins.
	const plugins = context.options.plugins ? context.options.plugins : [];
	// Parse every plugin configuration and look for a `pkgRoot` option.
	return plugins.reduce((pkgRootOptions, plugin) => {
		let config;
		if (isArray(plugin) && plugin.length > 1) {
			config = plugin[1];
		} else if (isPlainObject(plugin) && !isNil(plugin.path)) {
			({ ...config } = plugin);
		}
		// Keep any `pkgRoot` option that might exists but avoid duplicates.
		if (config && config.pkgRoot && !pkgRootOptions.includes(config.pkgRoot)) {
			pkgRootOptions.push(config.pkgRoot);
		}
		return pkgRootOptions;
	}, []);
}

/**
 * Return all the 'pkgRoot' from plugins as detailed objects.
 *
 * @param {MultiContext} context The multi-semantic-release context.
 * @param {Object} pkgExtras Options that apply to all packages.
 * @returns {Package[]} An array of package objects or an empty array otherwise.
 *
 * @internal
 */
function getRootPkgs(context, pkgExtras) {
	// Get all the `pkgRoot` options from plugins.
	return getPkgRootOptions(context).map((pkgRoot) => {
		// Make path absolute.
		const path = cleanPath(`${pkgRoot}/package.json`, context.cwd);
		// Get package.json file content.
		const manifest = getManifest(path);
		// Return a `Package` object like.
		return { path, manifest, ...pkgExtras };
	});
}

// Exports.
module.exports = {
	getPkgRootOptions,
	getRootPkgs,
};

const { isArray, isPlainObject, isNil } = require("lodash");

/**
 * Get all the 'pkgRoot' options from plugins.
 *
 * @param {MultiContext} context The multi-semantic-release context.
 * @returns {string[]} An array containing all the pkgRoot options (if any) or an empty array otherwise.
 *
 * @internal
 */
function getPkgRootOptions(context) {
	const plugins = context.options.plugins ? context.options.plugins : [];
	return plugins.reduce((pkgRootOptions, plugin) => {
		let config;
		if (isArray(plugin) && plugin.length > 1) {
			config = plugin[1];
		} else if (isPlainObject(plugin) && !isNil(plugin.path)) {
			({ ...config } = plugin);
		}
		if (config && config.pkgRoot && !pkgRootOptions.includes(config.pkgRoot)) {
			pkgRootOptions.push(config.pkgRoot);
		}
		return pkgRootOptions;
	}, []);
}

// Exports.
module.exports = getPkgRootOptions;

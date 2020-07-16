const glob = require("bash-glob");
const { getManifest } = require("./getManifest");
const { checker } = require("./blork");

const strings = checker("string[]+");

/**
 * Return array of package.json for Yarn workspaces.
 *
 * @param {string} cwd The current working directory where a package.json file can be found.
 * @returns {string[]} An array of package.json files corresponding to the workspaces setting in package.json
 */
function getWorkspacesYarn(cwd) {
	// Load package.json
	const manifest = getManifest(`${cwd}/package.json`);

	let packages;

	if (Array.isArray(manifest.workspaces) && strings(manifest.workspaces)) {
		packages = manifest.workspaces;
	}

	if (Array.isArray(manifest.workspaces && manifest.workspaces.packages) && strings(manifest.workspaces.packages)) {
		packages = manifest.workspaces.packages;
	}

	// Only continue if manifest.workspaces or manifest.workspaces.packages is an array of strings.
	if (!packages) {
		throw new TypeError("package.json: workspaces or workspaces.packages: Must be non-empty array of string");
	}

	// Turn workspaces into list of package.json files.
	const workspaces = glob.sync(
		packages.map((p) => p.replace(/\/?$/, "/package.json")),
		{
			cwd: cwd,
			realpath: true,
			ignore: "**/node_modules/**",
		}
	);

	// Must have at least one workspace.
	if (!workspaces.length) throw new TypeError("package.json: workspaces: Must contain one or more workspaces");

	// Return.
	return workspaces;
}

// Exports.
module.exports = getWorkspacesYarn;

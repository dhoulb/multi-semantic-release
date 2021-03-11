const { cosmiconfig, cosmiconfigSync } = require("cosmiconfig");

// Copied from get-config.js in semantic-release
const CONFIG_NAME = "release";
const CONFIG_FILES = [
	"package.json",
	`.${CONFIG_NAME}rc`,
	`.${CONFIG_NAME}rc.json`,
	`.${CONFIG_NAME}rc.yaml`,
	`.${CONFIG_NAME}rc.yml`,
	`.${CONFIG_NAME}rc.js`,
	`${CONFIG_NAME}.config.js`,
];
const CONFIG_NAME_MSR = "msr";

/**
 * Get the release configuration options for a given directory.
 * Unfortunately we've had to copy this over from semantic-release, creating unnecessary duplication.
 *
 * @param {string} cwd The directory to search.
 * @returns {Object} The found configuration option
 *
 * @internal
 */
async function getConfig(cwd) {
	// Call cosmiconfig.
	const config = await cosmiconfig(CONFIG_NAME, { searchPlaces: CONFIG_FILES }).search(cwd);

	// Return the found config or empty object.
	// istanbul ignore next (not important).
	return config ? config.config : {};
}

/**
 * Get the release configuration options for a given directory.
 * Unfortunately we've had to copy this over from semantic-release, creating unnecessary duplication.
 *
 * @param {string} cwd The directory to search.
 * @returns {Object} The found configuration option
 *
 * @internal
 */
function getConfigSync(cwd) {
	// Call cosmiconfig.
	const config = cosmiconfigSync(CONFIG_NAME, { searchPlaces: CONFIG_FILES }).search(cwd);

	// Return the found config or empty object.
	// istanbul ignore next (not important).
	return config ? config.config : {};
}

async function getConfigMsr(cwd) {
	const config = await getConfig(cwd);
	return config.hasOwnProperty(CONFIG_NAME_MSR) ? config[CONFIG_NAME_MSR] : {};
}

function getConfigMsrSync(cwd) {
	const config = getConfigSync(cwd);
	return config.hasOwnProperty(CONFIG_NAME_MSR) ? config[CONFIG_NAME_MSR] : {};
}

module.exports = {
	getConfig,
	getConfigSync,
	getConfigMsr,
	getConfigMsrSync,
};

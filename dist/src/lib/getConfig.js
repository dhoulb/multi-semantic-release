"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cosmiconfig_1 = require("cosmiconfig");
// Copied from get-config.js in semantic-release
const CONFIG_NAME = 'release';
const CONFIG_FILES = [
    'package.json',
    `.${CONFIG_NAME}rc`,
    `.${CONFIG_NAME}rc.json`,
    `.${CONFIG_NAME}rc.yaml`,
    `.${CONFIG_NAME}rc.yml`,
    `.${CONFIG_NAME}rc.js`,
    `${CONFIG_NAME}.config.js`,
];
/**
 * Get the release configuration options for a given directory.
 * Unfortunately we've had to copy this over from semantic-release, creating unnecessary duplication.
 *
 * @param cwd The directory to search.
 * @returns The found configuration option
 *
 * @internal
 */
async function getConfig(cwd) {
    // Call cosmiconfig.
    const config = await cosmiconfig_1.cosmiconfig(CONFIG_NAME, {
        searchPlaces: CONFIG_FILES,
    }).search(cwd);
    // Return the found config or empty object.
    // istanbul ignore next (not important).
    return (config != null) ? config.config : {};
}
exports.default = getConfig;

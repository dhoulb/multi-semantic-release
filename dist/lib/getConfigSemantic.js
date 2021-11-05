"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-expect-error
const get_config_1 = __importDefault(require("semantic-release/lib/get-config"));
const stream_buffers_1 = require("stream-buffers");
const signale_1 = require("signale");
/**
 * Get the release configuration options for a given directory.
 * Unfortunately we've had to copy this over from semantic-release, creating unnecessary duplication.
 *
 * @param context Object containing cwd, env, and logger properties that are passed to getConfig()
 * @param options Options object for the config.
 * @returns Returns what semantic-release's get config returns (object with options and plugins objects).
 *
 * @internal
 */
async function getConfigSemantic({ cwd, env, stdout, stderr, logger }, options) {
    try {
        // Blackhole logger (so we don't clutter output with "loaded plugin" messages).
        const blackhole = new signale_1.Signale({
            stream: new stream_buffers_1.WritableStreamBuffer(),
        });
        // Return semantic-release's getConfig script.
        return get_config_1.default({ cwd, env, stdout, stderr, logger: blackhole }, options);
    }
    catch (error) {
        // Log error and rethrow it.
        // istanbul ignore next (not important)
        logger.error(`Error in semantic-release getConfig(): %0`, error);
        // istanbul ignore next (not important)
        throw error;
    }
}
exports.default = getConfigSemantic;

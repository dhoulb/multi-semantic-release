"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = __importDefault(require("semantic-release/package.json"));
const getPackagePaths_1 = __importDefault(require("../lib/getPackagePaths"));
const multiSemanticRelease_1 = __importDefault(require("../lib/multiSemanticRelease"));
const package_json_2 = __importDefault(require("../../package.json"));
const debug_1 = __importDefault(require("debug"));
exports.default = (flags) => {
    if (flags.debug) {
        debug_1.default.enable('msr:*');
    }
    // Get directory.
    const cwd = process.cwd();
    // Catch errors.
    try {
        console.log(`multi-semantic-release version: ${package_json_2.default.version}`);
        console.log(`semantic-release version: ${package_json_1.default.version}`);
        console.log(`flags: ${JSON.stringify(flags, null, 2)}`);
        // Get list of package.json paths according to workspaces.
        const paths = getPackagePaths_1.default(cwd, flags.ignorePackages);
        console.log('package paths', paths);
        // Do multirelease (log out any errors).
        multiSemanticRelease_1.default(paths, {}, { cwd }, flags).then(() => {
            // Success.
            process.exit(0);
        }, error => {
            // Log out errors.
            console.error(`[multi-semantic-release]:`, error);
            process.exit(1);
        });
    }
    catch (error) {
        // Log out errors.
        console.error(`[multi-semantic-release]:`, error);
        process.exit(1);
    }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = __importDefault(require("semantic-release/package.json"));
const debug_1 = __importDefault(require("debug"));
const getPackagePaths_1 = __importDefault(require("../lib/getPackagePaths"));
const multiSemanticRelease_1 = __importDefault(require("../lib/multiSemanticRelease"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multisemrelPkgJson = require('../../package.json');
exports.default = (flags) => {
    var _a;
    if (flags.debug) {
        debug_1.default.enable('msr:*');
    }
    // Get directory.
    const cwd = process.cwd();
    // Catch errors.
    try {
        console.log(`multi-semantic-release version: ${(_a = multisemrelPkgJson.version) !== null && _a !== void 0 ? _a : 0}`);
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

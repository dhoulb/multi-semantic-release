"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const blork_1 = require("./blork");
/**
 * Normalize and make a path absolute, optionally using a custom CWD.
 * Trims any trailing slashes from the path.
 *
 * @param path The path to normalize and make absolute.
 * @param cwd=process.cwd() The CWD to prepend to the path to make it absolute.
 *
 * @returns The absolute and normalized path.
 *
 * @internal
 */
function cleanPath(path, cwd = process.cwd()) {
    // Checks.
    blork_1.check(path, 'path: path');
    blork_1.check(cwd, 'cwd: absolute');
    // Normalize, absolutify, and trim trailing slashes from the path.
    return path_1.normalize(path_1.isAbsolute(path) ? path : path_1.join(cwd, path)).replace(/[/\\]+$/, '');
}
exports.default = cleanPath;

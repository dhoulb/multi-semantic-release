"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_packages_1 = require("@manypkg/get-packages");
const path_1 = __importDefault(require("path"));
const glob_1 = __importDefault(require("./glob"));
const getManifest_1 = __importDefault(require("./getManifest"));
/**
 * Return array of package.json for workspace packages.
 *
 * @param cwd The current working directory where a package.json file can be found.
 * @param ignorePackages (Optional) Packages to be ignored passed via cli.
 * @returns An array of package.json files corresponding to the workspaces setting in package.json
 */
function getPackagePaths(cwd, ignorePackages) {
    let workspace = {
        tool: 'root',
        root: { dir: cwd },
    };
    // Ignore exceptions as we will rely on `getManifest` validation
    try {
        workspace = get_packages_1.getPackagesSync(cwd);
    }
    catch (e) {
        /**/
    }
    workspace.root.packageJson = getManifest_1.default(path_1.default.join(workspace.root.dir, 'package.json'));
    if (workspace.tool === 'root') {
        workspace.packages = [];
    }
    // remove cwd from results
    const packages = workspace.packages.map(p => path_1.default.relative(cwd, p.dir));
    // If packages to be ignored come from CLI, we need to combine them with the ones from manifest workspaces
    if (Array.isArray(ignorePackages)) {
        packages.push(...ignorePackages.map(p => `!${p}`));
    }
    // Turn workspaces into list of package.json files.
    const workspacePackages = glob_1.default(packages.map((p) => p.replace(/\/?$/, '/package.json')), {
        cwd: cwd,
        absolute: true,
        gitignore: true,
    });
    // Must have at least one workspace-package.
    if (workspacePackages.length === 0) {
        throw new TypeError('package.json: Project must contain one or more workspace-packages');
    }
    // Return.
    return workspacePackages;
}
exports.default = getPackagePaths;

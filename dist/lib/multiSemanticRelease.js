"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const semantic_release_1 = __importDefault(require("semantic-release"));
const lodash_1 = require("lodash");
const batching_toposort_1 = __importDefault(require("batching-toposort"));
const blork_1 = require("./blork");
const getLogger_1 = __importDefault(require("./getLogger"));
const getConfig_1 = __importDefault(require("./getConfig"));
const getConfigSemantic_1 = __importDefault(require("./getConfigSemantic"));
const getManifest_1 = __importDefault(require("./getManifest"));
const cleanPath_1 = __importDefault(require("./cleanPath"));
const RescopedStream_1 = __importDefault(require("./RescopedStream"));
const createInlinePluginCreator_1 = __importDefault(require("./createInlinePluginCreator"));
const utils_1 = require("./utils");
/**
 * Perform a multirelease.
 *
 * @param paths An array of paths to package.json files.
 * @param inputOptions An object containing semantic-release options.
 * @param settings An object containing: cwd, env, stdout, stderr (mainly for configuring tests).
 * @param flags Argv flags.
 * @returns Promise that resolves to a list of package objects with `result` property describing whether it released or not.
 */
async function multiSemanticRelease(paths, inputOptions = {}, { cwd = process.cwd(), env = process.env, stdout = process.stdout, stderr = process.stderr, } = {}, flags = { deps: {} }) {
    var _a;
    // Check params.
    blork_1.check(paths, 'paths: string[]');
    blork_1.check(cwd, 'cwd: directory');
    blork_1.check(env, 'env: objectlike');
    blork_1.check(stdout, 'stdout: stream');
    blork_1.check(stderr, 'stderr: stream');
    // eslint-disable-next-line no-param-reassign
    cwd = cleanPath_1.default(cwd);
    // Start.
    const logger = getLogger_1.default({ stdout, stderr });
    logger.complete(`Started multirelease! Loading ${paths.length} packages...`);
    // Vars.
    const globalOptions = await getConfig_1.default(cwd);
    const multiContext = {
        globalOptions,
        inputOptions,
        cwd,
        env,
        stdout,
        stderr,
        logger,
    };
    // Load packages from paths.
    const packages = await Promise.all(paths.map(async (path) => await getPackage(path, multiContext)));
    packages.forEach(pkg => {
        // Once we load all the packages we can find their cross refs
        // Make a list of local dependencies.
        // Map dependency names (e.g. my-awesome-dep) to their actual package objects in the packages array.
        // eslint-disable-next-line no-param-reassign
        pkg.localDeps = lodash_1.uniq(pkg.deps.map(d => packages.find(p => d === p.name)).filter(utils_1.isDefined));
        logger.success(`Loaded package ${pkg.name}`);
    });
    logger.complete(`Queued ${packages.length} packages! Starting release...`);
    // Release all packages.
    const createInlinePlugin = createInlinePluginCreator_1.default(multiContext, flags);
    const pkgDag = packages.reduce((acc, pkg) => {
        pkg.localDeps.forEach(dep => acc[dep.name].push(pkg.name));
        return acc;
    }, packages.reduce((acc, pkg) => ({ ...acc, [pkg.name]: [] }), {}));
    try {
        const batches = batching_toposort_1.default(pkgDag).flat(1);
        for (const pkgName of batches) {
            const pkg = packages.find(_pkg => _pkg.name === pkgName);
            if (!pkg) {
                throw new Error(`Inexistant package ${pkgName} in batch`);
            }
            await releasePackage(pkg, createInlinePlugin, multiContext, flags);
        }
        const released = packages.filter(pkg => pkg.result).length;
        // Return packages list.
        logger.complete(`Released ${released} of ${packages.length} packages, semantically!`);
        return packages;
    }
    catch (err) {
        if ((_a = err.message) === null || _a === void 0 ? void 0 : _a.startsWith('Cycle(s) detected;')) {
            throw new Error('Cycle has been detected in local dependencies.');
        }
        throw err;
    }
}
exports.default = multiSemanticRelease;
/**
 * Load details about a package.
 *
 * @param path The path to load details about.
 * @param allOptions Options that apply to all packages.
 * @param multiContext Context object for the multirelease.
 * @returns>} A package object, or void if the package was skipped.
 *
 * @internal
 */
async function getPackage(path, { globalOptions, inputOptions, env, cwd, stdout, stderr, }) {
    // Make path absolute.
    // eslint-disable-next-line no-param-reassign
    path = cleanPath_1.default(path, cwd);
    const dir = path_1.dirname(path);
    // Get package.json file contents.
    const manifest = getManifest_1.default(path);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const name = manifest.name;
    // Combine list of all dependency names.
    const deps = Object.keys({
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
        ...manifest.optionalDependencies,
    });
    // Load the package-specific options.
    const pkgOptions = await getConfig_1.default(dir);
    // The 'final options' are the global options merged with package-specific options.
    // We merge this ourselves because package-specific options can override global options.
    const finalOptions = Object.assign({}, globalOptions, pkgOptions, inputOptions);
    // Make a fake logger so semantic-release's get-config doesn't fail.
    const logger = { error() { }, log() { } };
    // Use semantic-release's internal config (now we have the right `options.plugins` setting) to get the plugins object and the package options including defaults.
    // We need this so we can call e.g. plugins.analyzeCommit() to be able to affect the input and output of the whole set of plugins.
    const { options, plugins } = await getConfigSemantic_1.default({ cwd: dir, env, stdout, stderr, logger, globalOptions, inputOptions }, finalOptions);
    // Return package object.
    return {
        path,
        dir,
        name,
        manifest,
        deps,
        options,
        plugins,
        loggerRef: logger,
        localDeps: [],
    };
}
/**
 * Release an individual package.
 *
 * @param pkg The specific package.
 * @param createInlinePlugin A function that creates an inline plugin.
 * @param multiContext Context object for the multirelease.
 * @param flags Argv flags.
 * @returns Promise that resolves when done.
 *
 * @internal
 */
async function releasePackage(pkg, createInlinePlugin, multiContext, flags) {
    // Vars.
    const { options: pkgOptions, name, dir } = pkg;
    const { env, stdout, stderr } = multiContext;
    // Make an 'inline plugin' for this package.
    // The inline plugin is the only plugin we call semanticRelease() with.
    // The inline plugin functions then call e.g. plugins.analyzeCommits() manually and sometimes manipulate the responses.
    const inlinePlugin = createInlinePlugin(pkg);
    // Set the options that we call semanticRelease() with.
    // This consists of:
    // - The global options (e.g. from the top level package.json)
    // - The package options (e.g. from the specific package's package.json)
    const options = { ...flags, ...pkgOptions, ...inlinePlugin };
    // Add the package name into tagFormat.
    // Thought about doing a single release for the tag (merging several packages), but it's impossible to prevent Github releasing while allowing NPM to continue.
    // It'd also be difficult to merge all the assets into one release without full editing/overriding the plugins.
    options.tagFormat = `${name}@\${version}`;
    // This options are needed for plugins that do not rely on `pluginOptions` and extract them independently.
    options._pkgOptions = pkgOptions;
    // Call semanticRelease() on the directory and save result to pkg.
    // Don't need to log out errors as semantic-release already does that.
    // eslint-disable-next-line no-param-reassign
    pkg.result = await semantic_release_1.default(options, {
        cwd: dir,
        env,
        stdout: new RescopedStream_1.default(stdout, name),
        stderr: new RescopedStream_1.default(stderr, name),
    });
}

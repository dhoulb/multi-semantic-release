"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const path_1 = require("path");
const git_log_parser_1 = __importDefault(require("git-log-parser"));
const execa_1 = __importDefault(require("execa"));
const get_stream_1 = __importDefault(require("get-stream"));
const blork_1 = require("./blork");
const cleanPath_1 = __importDefault(require("./cleanPath"));
const debug = debug_1.default('msr:commitsFilter');
// Add correct fields to gitLogParser.
Object.assign(git_log_parser_1.default.fields, {
    hash: 'H',
    message: 'B',
    gitTags: 'd',
    committerDate: { key: 'ci', type: Date },
});
/**
 * Retrieve the list of commits on the current branch since the commit sha associated with the last release, or all the commits of the current branch if there is no last released version.
 * Commits are filtered to only return those that corresponding to the package directory.
 *
 * This is achieved by using "-- my/dir/path" with `git log` — passing this into gitLogParser() with
 *
 * @param  cwd Absolute path of the working directory the Git repo is in.
 * @param  dir Path to the target directory to filter by. Either absolute, or relative to cwd param.
 * @param  lastRelease The SHA of the previous release (default to start of all commits if undefined)
 * @param  nextRelease The SHA of the next release (default to HEAD if undefined)
 * @param  firstParentBranch first-parent to determine which merges went into master
 * @return The list of commits on the branch `branch` since the last release.
 */
async function getCommitsFiltered(cwd, dir, lastRelease, nextRelease, firstParentBranch) {
    // Clean paths and make sure directories exist.
    blork_1.check(cwd, 'cwd: directory');
    blork_1.check(dir, 'dir: path');
    // eslint-disable-next-line no-param-reassign
    cwd = cleanPath_1.default(cwd);
    // eslint-disable-next-line no-param-reassign
    dir = cleanPath_1.default(dir, cwd);
    blork_1.check(dir, 'dir: directory');
    blork_1.check(lastRelease, 'lastRelease: alphanumeric{40}?');
    blork_1.check(nextRelease, 'nextRelease: alphanumeric{40}?');
    // target must be inside and different than cwd.
    if (!dir.startsWith(cwd)) {
        throw new blork_1.ValueError('dir: Must be inside cwd', dir);
    }
    if (dir === cwd) {
        throw new blork_1.ValueError('dir: Must not be equal to cwd', dir);
    }
    // Get top-level Git directory as it might be higher up the tree than cwd.
    const root = (await execa_1.default('git', ['rev-parse', '--show-toplevel'], { cwd }))
        .stdout;
    // Use git-log-parser to get the commits.
    const relpath = path_1.relative(root, dir);
    const firstParentBranchFilter = firstParentBranch
        ? ['--first-parent', firstParentBranch]
        : [];
    const range = (lastRelease ? `${lastRelease}..` : '') + (nextRelease !== null && nextRelease !== void 0 ? nextRelease : 'HEAD');
    const gitLogFilterQuery = [...firstParentBranchFilter, range, '--', relpath];
    const stream = git_log_parser_1.default.parse({ _: gitLogFilterQuery }, { cwd, env: process.env });
    const commits = await get_stream_1.default.array(stream);
    // Trim message and tags.
    commits.forEach(commit => {
        // eslint-disable-next-line no-param-reassign
        commit.message = commit.message.trim();
        // eslint-disable-next-line no-param-reassign
        commit.gitTags = commit.gitTags.trim();
    });
    debug('git log filter query: %o', gitLogFilterQuery);
    debug('filtered commits: %O', commits);
    // Return the commits.
    return commits;
}
exports.default = getCommitsFiltered;

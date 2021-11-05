"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTagHead = exports.getTags = void 0;
const execa_1 = __importDefault(require("execa"));
/**
 * Get all the tags for a given branch.
 *
 * @param branch The branch for which to retrieve the tags.
 * @param execaOptions Options to pass to `execa`.
 * @param filters List of prefixes/sufixes to be checked inside tags.
 *
 * @return List of git tags.
 * @throws {Error} If the `git` command fails.
 * @internal
 */
function getTags(branch, execaOptions = {}, filters) {
    const stringTags = execa_1.default.sync('git', ['tag', '--merged', branch], execaOptions).stdout;
    const tags = stringTags
        .split('\n')
        .map(tag => tag.trim())
        .filter(Boolean);
    if ((filters == null) || (filters.length === 0)) {
        return tags;
    }
    const validateSubstr = (t, f) => !!f.find(v => t.includes(v));
    return tags.filter(tag => validateSubstr(tag, filters));
}
exports.getTags = getTags;
/**
 * Get the commit sha for a given tag.
 *
 * @param tagName Tag name for which to retrieve the commit sha.
 * @param execaOptions Options to pass to `execa`.
 *
 * @return The commit sha of the tag in parameter or `null`.
 */
async function getTagHead(tagName, execaOptions = {}) {
    return (await execa_1.default('git', ['rev-list', '-1', tagName], execaOptions)).stdout;
}
exports.getTagHead = getTagHead;

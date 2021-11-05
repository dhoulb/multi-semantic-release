"use strict";
/**
 * Lifted and tweaked from semantic-release because we follow how they bump their packages/dependencies.
 * https://github.com/semantic-release/semantic-release/blob/master/lib/utils.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNotNull = exports.isDefined = exports.getLatestVersion = exports.getLowestVersion = exports.getHighestVersion = exports.tagsToVersions = void 0;
const semver_1 = require("semver");
/**
 * Get tag objects and convert them to a list of stringified versions.
 * @param tags Tags as object list.
 * @returns Tags as string list.
 * @internal
 */
function tagsToVersions(tags = []) {
    return (tags !== null && tags !== void 0 ? tags : []).map(({ version }) => version);
}
exports.tagsToVersions = tagsToVersions;
/**
 * HOC that applies highest/lowest semver function.
 * @param predicate High order function to be called.
 * @param version1 Version 1 to be compared with.
 * @param version2 Version 2 to be compared with.
 * @returns Highest or lowest version.
 * @internal
 */
const _selectVersionBy = (predicate, version1, version2) => {
    if ((predicate != null) && version1 != null && version2 != null) {
        return predicate(version1, version2) ? version1 : version2;
    }
    return version1 !== null && version1 !== void 0 ? version1 : version2;
};
/**
 * Gets highest semver function binding gt to the HOC selectVersionBy.
 */
exports.getHighestVersion = _selectVersionBy.bind(null, semver_1.gt);
/**
 * Gets lowest semver function binding gt to the HOC selectVersionBy.
 */
exports.getLowestVersion = _selectVersionBy.bind(null, semver_1.lt);
/**
 * Retrieve the latest version from a list of versions.
 * @param versions Versions as string list.
 * @param withPrerelease Prerelease flag.
 * @returns Latest version.
 * @internal
 */
function getLatestVersion(versions, withPrerelease = false) {
    return versions
        .filter(version => withPrerelease || (semver_1.prerelease(version) == null))
        .sort(semver_1.rcompare)[0];
}
exports.getLatestVersion = getLatestVersion;
/**
 * Check if a value is defined or not
 *
 * @param value
 * @returns
 */
function isDefined(value) {
    return value !== undefined;
}
exports.isDefined = isDefined;
/**
 * Check if a value is not null
 *
 * @param value
 * @returns
 */
function isNotNull(value) {
    return value !== null;
}
exports.isNotNull = isNotNull;

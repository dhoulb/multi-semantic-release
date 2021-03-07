const { resolve } = require("path");
const getWorkspacesYarn = require("../../lib/getWorkspacesYarn");

// Tests.
describe("getWorkspacesYarn()", () => {
	test("Works correctly with workspaces", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspaces`);
		expect(getWorkspacesYarn(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
			`${resolved}/packages/d/package.json`,
		]);
	});
	test("Should ignore some packages", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnore`);
		expect(getWorkspacesYarn(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
		]);

		const resolvedSplit = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnoreSplit`);
		expect(getWorkspacesYarn(resolvedSplit)).toEqual([
			`${resolvedSplit}/packages/a/package.json`,
			`${resolvedSplit}/packages/c/package.json`,
		]);
	});
	test("Should ignore some packages via CLI", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnore`);
		expect(getWorkspacesYarn(resolved, ["packages/a/**", "packages/b/**"])).toEqual([
			`${resolved}/packages/c/package.json`,
		]);

		const resolvedSplit = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnoreSplit`);
		expect(getWorkspacesYarn(resolvedSplit, ["packages/b", "packages/d"])).toEqual([
			`${resolvedSplit}/packages/a/package.json`,
			`${resolvedSplit}/packages/c/package.json`,
		]);
	});
	test("Should throw when ignored packages from CLI and workspaces sets an empty workspace list to be processed", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnore`);
		expect(() => getWorkspacesYarn(resolved, ["packages/a/**", "packages/b/**", "packages/c/**"])).toThrow(
			TypeError
		);
		expect(() => getWorkspacesYarn(resolved, ["packages/a/**", "packages/b/**", "packages/c/**"])).toThrow(
			"package.json: workspaces: Must contain one or more workspaces"
		);
	});
	test("TypeError if bad workspaces setting", () => {
		const resolved = resolve(`${__dirname}/../fixtures/badYarnWorkspaces`);
		expect(() => getWorkspacesYarn(resolved)).toThrow(TypeError);
		expect(() => getWorkspacesYarn(resolved)).toThrow("non-empty array of string");
	});
	test("TypeError if no workspaces setting", () => {
		const resolved = resolve(`${__dirname}/../fixtures/undefinedYarnWorkspaces`);
		expect(() => getWorkspacesYarn(resolved)).toThrow(TypeError);
		expect(() => getWorkspacesYarn(resolved)).toThrow("non-empty array of string");
	});
	test("Error if no workspaces setting", () => {
		const resolved = resolve(`${__dirname}/../fixtures/emptyYarnWorkspaces`);
		expect(() => getWorkspacesYarn(resolved)).toThrow(Error);
		expect(() => getWorkspacesYarn(resolved)).toThrow("contain one or more workspaces");
	});
	test("Works correctly with workspaces.packages", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesPackages`);
		expect(getWorkspacesYarn(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
			`${resolved}/packages/d/package.json`,
		]);
	});
});

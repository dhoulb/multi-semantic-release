const { resolve } = require("path");
const getPackagePaths = require("../../lib/getPackagePaths");

// Tests.
describe("getPackagePaths()", () => {
	test("yarn: Works correctly with workspaces", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspaces`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
			`${resolved}/packages/d/package.json`,
		]);
	});
	test("yarn: Should ignore some packages", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnore`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
		]);

		const resolvedSplit = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnoreSplit`);
		expect(getPackagePaths(resolvedSplit)).toEqual([
			`${resolvedSplit}/packages/a/package.json`,
			`${resolvedSplit}/packages/c/package.json`,
		]);
	});
	test("yarn: Should ignore some packages via CLI", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnore`);
		expect(getPackagePaths(resolved, ["packages/a/**", "packages/b/**"])).toEqual([
			`${resolved}/packages/c/package.json`,
		]);

		const resolvedSplit = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnoreSplit`);
		expect(getPackagePaths(resolvedSplit, ["packages/b", "packages/d"])).toEqual([
			`${resolvedSplit}/packages/a/package.json`,
			`${resolvedSplit}/packages/c/package.json`,
		]);
	});
	test("yarn: Should throw when ignored packages from CLI and workspaces sets an empty workspace list to be processed", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesIgnore`);
		expect(() => getPackagePaths(resolved, ["packages/a/**", "packages/b/**", "packages/c/**"])).toThrow(TypeError);
		expect(() => getPackagePaths(resolved, ["packages/a/**", "packages/b/**", "packages/c/**"])).toThrow(
			"package.json: Project must contain one or more workspace-packages"
		);
	});
	test("yarn: Error if no workspaces setting", () => {
		const resolved = resolve(`${__dirname}/../fixtures/emptyYarnWorkspaces`);
		expect(() => getPackagePaths(resolved)).toThrow(Error);
		expect(() => getPackagePaths(resolved)).toThrow("contain one or more workspace-packages");
	});
	test("yarn: Works correctly with workspaces.packages", () => {
		const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspacesPackages`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
			`${resolved}/packages/d/package.json`,
		]);
	});
	test("pnpm: Works correctly with workspace", () => {
		const resolved = resolve(`${__dirname}/../fixtures/pnpmWorkspace`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
			`${resolved}/packages/d/package.json`,
		]);
	});
	test("pnpm: Error if no workspaces setting", () => {
		const resolved = resolve(`${__dirname}/../fixtures/pnpmWorkspaceUndefined`);
		expect(() => getPackagePaths(resolved)).toThrow(Error);
		expect(() => getPackagePaths(resolved)).toThrow("contain one or more workspace-packages");
	});
	test("pnpm: Should ignore some packages", () => {
		const resolved = resolve(`${__dirname}/../fixtures/pnpmWorkspaceIgnore`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
		]);
	});
	test("pnpm: Should ignore some packages via CLI", () => {
		const resolved = resolve(`${__dirname}/../fixtures/pnpmWorkspaceIgnore`);
		expect(getPackagePaths(resolved, ["packages/a/**", "packages/b/**"])).toEqual([
			`${resolved}/packages/c/package.json`,
		]);
	});
	test("bolt: Works correctly with workspaces", () => {
		const resolved = resolve(`${__dirname}/../fixtures/boltWorkspaces`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
			`${resolved}/packages/d/package.json`,
		]);
	});
	test("bolt: Error if no workspaces setting", () => {
		const resolved = resolve(`${__dirname}/../fixtures/boltWorkspacesUndefined`);
		expect(() => getPackagePaths(resolved)).toThrow(Error);
		expect(() => getPackagePaths(resolved)).toThrow("contain one or more workspace-packages");
	});
	test("bolt: Should ignore some packages", () => {
		const resolved = resolve(`${__dirname}/../fixtures/boltWorkspacesIgnore`);
		expect(getPackagePaths(resolved)).toEqual([
			`${resolved}/packages/a/package.json`,
			`${resolved}/packages/b/package.json`,
			`${resolved}/packages/c/package.json`,
		]);
	});
	test("bolt: Should ignore some packages via CLI", () => {
		const resolved = resolve(`${__dirname}/../fixtures/boltWorkspacesIgnore`);
		expect(getPackagePaths(resolved, ["packages/a/**", "packages/b/**"])).toEqual([
			`${resolved}/packages/c/package.json`,
		]);
	});
});

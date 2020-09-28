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
	test("Checks `bash` to be installed", () => {
		jest.isolateModules(() => {
			jest.resetModules();
			jest.mock("bash-path", () => undefined);

			const resolved = resolve(`${__dirname}/../fixtures/yarnWorkspaces`);
			const getWorkspaces = require("../../lib/getWorkspacesYarn");

			expect(() => getWorkspaces(resolved)).toThrowError("`bash` must be installed");
		});
	});
});

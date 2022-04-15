const getPkgRootOptions = require("../../lib/getPkgRootOptions");

// Clear mocks before tests.
beforeEach(() => {
	jest.clearAllMocks(); // Clear all mocks.
	require.cache = {}; // Clear the require cache so modules are loaded fresh.
});

// Tests.
describe("getPkgRootOptions()", () => {
	test("no plugins: Should not find any options", async () => {
		expect(getPkgRootOptions({ options: {} })).toEqual([]);
	});
	test("plugins without options: Should not find any options", async () => {
		const context = {
			options: {
				plugins: [
					"@semantic-release/commit-analyzer",
					"@semantic-release/release-notes-generator",
					"@semantic-release/npm",
				],
			},
		};
		expect(getPkgRootOptions(context)).toEqual([]);
	});
	test("plugin as array: Should find one option", async () => {
		const context = {
			options: {
				plugins: [
					"@semantic-release/commit-analyzer",
					"@semantic-release/release-notes-generator",
					[
						"@semantic-release/npm",
						{
							pkgRoot: "../../dist/a",
							npmPublish: false,
						},
					],
				],
			},
		};
		expect(getPkgRootOptions(context)).toEqual(["../../dist/a"]);
	});
	test("plugin as object: Should find one option", async () => {
		const context = {
			options: {
				plugins: [
					"@semantic-release/commit-analyzer",
					"@semantic-release/release-notes-generator",
					{
						path: "@semantic-release/npm",
						pkgRoot: "../../dist/a",
						npmPublish: false,
					},
				],
			},
		};
		expect(getPkgRootOptions(context)).toEqual(["../../dist/a"]);
	});
	test("Should find multiple options", async () => {
		const context = {
			options: {
				plugins: [
					[
						"@semantic-release/custom-plugin",
						{
							pkgRoot: "../../dist/a",
						},
					],
					"@semantic-release/release-notes-generator",
					[
						"@semantic-release/npm",
						{
							pkgRoot: "../../dist/b",
							npmPublish: false,
						},
					],
				],
			},
		};
		expect(getPkgRootOptions(context)).toEqual(["../../dist/a", "../../dist/b"]);
	});
	test("Should not dedupe options", async () => {
		const context = {
			options: {
				plugins: [
					[
						"@semantic-release/custom-plugin",
						{
							pkgRoot: "../../dist/a",
						},
					],
					"@semantic-release/release-notes-generator",
					[
						"@semantic-release/npm",
						{
							pkgRoot: "../../dist/a",
							npmPublish: false,
						},
					],
				],
			},
		};
		expect(getPkgRootOptions(context)).toEqual(["../../dist/a"]);
	});
});

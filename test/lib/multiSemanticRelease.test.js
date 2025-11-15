const { writeFileSync } = require("fs");
const path = require("path");
const { Signale } = require("signale");
const { WritableStreamBuffer } = require("stream-buffers");
const { copyDirectory, createNewTestingFiles } = require("../helpers/file");
const {
	gitInit,
	gitAdd,
	gitCommit,
	gitCommitAll,
	gitInitOrigin,
	gitPush,
	gitTag,
	gitGetTags,
} = require("../helpers/git");

console.log("!!!", globalThis.__msr__);

// Clear mocks before tests.
beforeEach(() => {
	jest.clearAllMocks(); // Clear all mocks.
	require.cache = {}; // Clear the require cache so modules are loaded fresh.
});

const env = {
	GH_TOKEN: "test",
	NPM_TOKEN: "test",
	PATH: process.env.PATH,
};

// Tests.
describe("multiSemanticRelease()", () => {
	test("Initial commit (changes in all packages)", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha = gitCommitAll(cwd, "feat: Initial release");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[
				`packages/a/package.json`,
				`packages/b/package.json`,
				`packages/c/package.json`,
				`packages/d/package.json`,
			],
			{},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 4 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-a@1.0.0");
		expect(out).toMatch("Created tag msr-test-b@1.0.0");
		expect(out).toMatch("Created tag msr-test-c@1.0.0");
		expect(out).toMatch("Created tag msr-test-d@1.0.0");
		expect(out).toMatch("Released 4 of 4 packages, semantically!");

		// A.
		expect(result[0].name).toBe("msr-test-a");
		expect(result[0].result.lastRelease).toEqual({});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-a@1.0.0",
			type: "minor",
			version: "1.0.0",
		});
		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a 1.0.0");
		expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[0].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0");

		// B.
		expect(result[1].name).toBe("msr-test-b");
		expect(result[1].result.lastRelease).toEqual({});
		expect(result[1].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-b@1.0.0",
			type: "minor",
			version: "1.0.0",
		});
		expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b 1.0.0");
		expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[1].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0"
		);

		// C.
		expect(result[2].name).toBe("msr-test-c");
		expect(result[2].result.lastRelease).toEqual({});
		expect(result[2].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-c@1.0.0",
			type: "minor",
			version: "1.0.0",
		});
		expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c 1.0.0");
		expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[2].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0");

		// D.
		expect(result[3].name).toBe("msr-test-d");
		expect(result[3].result.lastRelease).toEqual({});
		expect(result[3].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-d@1.0.0",
			type: "minor",
			version: "1.0.0",
		});
		expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d 1.0.0");
		expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

		// ONLY four times.
		expect(result).toHaveLength(4);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.0",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.0.0",
			},
			devDependencies: {
				"msr-test-c": "1.0.0",
			},
		});
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.0",
				"msr-test-d": "1.0.0",
			},
		});
	});
	test("Initial commit (changes in all packages with prereleases)", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit("master", "release");
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha = gitCommitAll(cwd, "feat: Initial release");
		gitInitOrigin(cwd, "release");
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[
				`packages/a/package.json`,
				`packages/b/package.json`,
				`packages/c/package.json`,
				`packages/d/package.json`,
			],
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 4 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-a@1.0.0-dev.1");
		expect(out).toMatch("Created tag msr-test-b@1.0.0-dev.1");
		expect(out).toMatch("Created tag msr-test-c@1.0.0-dev.1");
		expect(out).toMatch("Created tag msr-test-d@1.0.0-dev.1");
		expect(out).toMatch("Released 4 of 4 packages, semantically!");

		// A.
		expect(result[0].name).toBe("msr-test-a");
		expect(result[0].result.lastRelease).toEqual({});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-a@1.0.0-dev.1",
			type: "minor",
			version: "1.0.0-dev.1",
		});
		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a 1.0.0-dev.1");
		expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[0].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0-dev.1"
		);

		// B.
		expect(result[1].name).toBe("msr-test-b");
		expect(result[1].result.lastRelease).toEqual({});
		expect(result[1].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-b@1.0.0-dev.1",
			type: "minor",
			version: "1.0.0-dev.1",
		});
		expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b 1.0.0-dev.1");
		expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[1].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0-dev.1\n* **msr-test-c:** upgraded to 1.0.0-dev.1"
		);

		// C.
		expect(result[2].name).toBe("msr-test-c");
		expect(result[2].result.lastRelease).toEqual({});
		expect(result[2].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-c@1.0.0-dev.1",
			type: "minor",
			version: "1.0.0-dev.1",
		});
		expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c 1.0.0-dev.1");
		expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[2].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0-dev.1"
		);

		// D.
		expect(result[3].name).toBe("msr-test-d");
		expect(result[3].result.lastRelease).toEqual({});
		expect(result[3].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-d@1.0.0-dev.1",
			type: "minor",
			version: "1.0.0-dev.1",
		});
		expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d 1.0.0-dev.1");
		expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
		expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

		// ONLY four times.
		expect(result).toHaveLength(4);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.0-dev.1",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.0.0-dev.1",
			},
			devDependencies: {
				"msr-test-c": "1.0.0-dev.1",
			},
		});
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.0-dev.1",
				"msr-test-d": "1.0.0-dev.1",
			},
		});
	});
	test("Two separate releases (changes in only one package in second release with prereleases)", async () => {
		const packages = ["packages/c/", "packages/d/"];

		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit("master", "release");
		copyDirectory(`test/fixtures/yarnWorkspaces2Packages/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitInitOrigin(cwd, "release");
		gitPush(cwd);

		let stdout = new WritableStreamBuffer();
		let stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		let result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Add new testing files for a new release.
		createNewTestingFiles(["packages/c/"], cwd);
		const sha = gitCommitAll(cwd, "feat: New release on package c only");
		gitPush(cwd);

		// Capture output.
		stdout = new WritableStreamBuffer();
		stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease() for a second release
		// Doesn't include plugins that actually publish.
		result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 2 packages...");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 2 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-c@1.0.0-dev.2");
		expect(out).toMatch("Released 1 of 2 packages, semantically!");

		// D.
		expect(result[0].name).toBe("msr-test-c");
		expect(result[0].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-c@1.0.0-dev.1",
			name: "msr-test-c@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-c@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});

		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-c [1.0.0-dev.2]");
		expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* New release on package c only");
		expect(result[0].result.nextRelease.notes).not.toMatch("### Dependencies");

		// ONLY 1 time.
		expect(result).toHaveLength(2);

		// Check manifests.
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-d": "1.0.0-dev.1",
			},
		});
	});
	test("Two separate releases (release to prerelease)", async () => {
		const packages = ["packages/c/", "packages/d/"];

		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit("master", "release");
		copyDirectory(`test/fixtures/yarnWorkspaces2Packages/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitInitOrigin(cwd, "release");
		gitPush(cwd);

		let stdout = new WritableStreamBuffer();
		let stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		let result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Add new testing files for a new release.
		createNewTestingFiles(packages, cwd);
		const sha = gitCommitAll(cwd, "feat: New prerelease\n\nBREAKING CHANGE: bump to bigger value");
		gitPush(cwd);

		// Capture output.
		stdout = new WritableStreamBuffer();
		stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease() for a second release
		// Doesn't include plugins that actually publish.
		// Change the master branch from release to prerelease to test bumping.
		result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "beta" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 2 packages...");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 2 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-c@2.0.0-beta.1");
		expect(out).toMatch("Created tag msr-test-d@2.0.0-beta.1");
		expect(out).toMatch("Released 2 of 2 packages, semantically!");

		// D.
		expect(result[0].name).toBe("msr-test-c");
		expect(result[0].result.lastRelease).toEqual({
			channels: [null],
			gitHead: sha1,
			gitTag: "msr-test-c@1.0.0",
			name: "msr-test-c@1.0.0",
			version: "1.0.0",
		});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-c@2.0.0-beta.1",
			type: "major",
			version: "2.0.0-beta.1",
		});

		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-c [2.0.0-beta.1]");
		expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* New prerelease");
		expect(result[0].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-d:** upgraded to 2.0.0-beta.1"
		);

		expect(result[1].result.nextRelease.notes).toMatch("# msr-test-d [2.0.0-beta.1]");
		expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* New prerelease");
		expect(result[1].result.nextRelease.notes).not.toMatch("### Dependencies");

		// ONLY 1 time.
		expect(result).toHaveLength(2);

		// Check manifests.
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-d": "2.0.0-beta.1",
			},
		});
	}, 10000);
	test("Two separate releases (changes in all packages with prereleases)", async () => {
		const packages = ["packages/a/", "packages/b/", "packages/c/", "packages/d/"];

		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit("master", "release");
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitInitOrigin(cwd, "release");
		gitPush(cwd);

		let stdout = new WritableStreamBuffer();
		let stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		let result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Add new testing files for a new release.
		createNewTestingFiles(packages, cwd);
		const sha = gitCommitAll(cwd, "feat: New releases");
		gitPush(cwd);

		// Capture output.
		stdout = new WritableStreamBuffer();
		stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease() for a second release
		// Doesn't include plugins that actually publish.
		result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 4 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-a@1.0.0-dev.2");
		expect(out).toMatch("Created tag msr-test-b@1.0.0-dev.2");
		expect(out).toMatch("Created tag msr-test-c@1.0.0-dev.2");
		expect(out).toMatch("Created tag msr-test-d@1.0.0-dev.2");
		expect(out).toMatch("Released 4 of 4 packages, semantically!");

		// A.
		expect(result[0].name).toBe("msr-test-a");
		expect(result[0].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-a@1.0.0-dev.1",
			name: "msr-test-a@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-a@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a [1.0.0-dev.2]");
		expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[0].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0-dev.2"
		);

		// B.
		expect(result[1].name).toBe("msr-test-b");
		expect(result[1].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-b@1.0.0-dev.1",
			name: "msr-test-b@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[1].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-b@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b [1.0.0-dev.2]");
		expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[1].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0-dev.2\n* **msr-test-c:** upgraded to 1.0.0-dev.2"
		);

		// C.
		expect(result[2].name).toBe("msr-test-c");
		expect(result[2].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-c@1.0.0-dev.1",
			name: "msr-test-c@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[2].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-c@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c [1.0.0-dev.2]");
		expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[2].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0-dev.2"
		);

		// D.
		expect(result[3].name).toBe("msr-test-d");
		expect(result[3].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-d@1.0.0-dev.1",
			name: "msr-test-d@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[3].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-d@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d [1.0.0-dev.2]");
		expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

		// ONLY four times.
		expect(result).toHaveLength(4);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.0.0-dev.2",
			},
			devDependencies: {
				"msr-test-c": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.0-dev.2",
				"msr-test-d": "1.0.0-dev.2",
			},
		});
	}, 10000);
	test("Two separate releases (changes in all packages included those in pkgRoot destinations)", async () => {
		const packages = ["packages/a/", "packages/b/", "packages/c/", "packages/d/"];

		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit("master", "release");
		copyDirectory(`test/fixtures/pkgRootOptions/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitInitOrigin(cwd, "release");
		gitPush(cwd);

		let stdout = new WritableStreamBuffer();
		let stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		const multiSemanticRelease = require("../../");
		let result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Add new testing files for a new release.
		createNewTestingFiles(packages, cwd);
		const sha = gitCommitAll(cwd, "feat: New releases");
		gitPush(cwd);

		// Capture output.
		stdout = new WritableStreamBuffer();
		stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease() for a second release
		result = await multiSemanticRelease(
			packages.map((folder) => `${folder}package.json`),
			{
				branches: [{ name: "master", prerelease: "dev" }, { name: "release" }],
			},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 4 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-a@1.0.0-dev.2");
		expect(out).toMatch("Created tag msr-test-b@1.0.0-dev.2");
		expect(out).toMatch("Created tag msr-test-c@1.0.0-dev.2");
		expect(out).toMatch("Created tag msr-test-d@1.0.0-dev.2");
		expect(out).toMatch("Released 4 of 4 packages, semantically!");

		// A.
		expect(result[0].name).toBe("msr-test-a");
		expect(result[0].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-a@1.0.0-dev.1",
			name: "msr-test-a@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-a@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a [1.0.0-dev.2]");
		expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[0].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0-dev.2"
		);

		// B.
		expect(result[1].name).toBe("msr-test-b");
		expect(result[1].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-b@1.0.0-dev.1",
			name: "msr-test-b@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[1].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-b@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b [1.0.0-dev.2]");
		expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[1].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0-dev.2\n* **msr-test-c:** upgraded to 1.0.0-dev.2"
		);

		// C.
		expect(result[2].name).toBe("msr-test-c");
		expect(result[2].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-c@1.0.0-dev.1",
			name: "msr-test-c@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[2].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-c@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c [1.0.0-dev.2]");
		expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[2].result.nextRelease.notes).toMatch(
			"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0-dev.2"
		);

		// D.
		expect(result[3].name).toBe("msr-test-d");
		expect(result[3].result.lastRelease).toEqual({
			channels: ["master"],
			gitHead: sha1,
			gitTag: "msr-test-d@1.0.0-dev.1",
			name: "msr-test-d@1.0.0-dev.1",
			version: "1.0.0-dev.1",
		});
		expect(result[3].result.nextRelease).toMatchObject({
			gitHead: sha,
			gitTag: "msr-test-d@1.0.0-dev.2",
			type: "minor",
			version: "1.0.0-dev.2",
		});
		expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d [1.0.0-dev.2]");
		expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* New releases");
		expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

		// ONLY four times.
		expect(result).toHaveLength(4);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/dist/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.0.0-dev.2",
			},
			devDependencies: {
				"msr-test-c": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/dist/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.0.0-dev.2",
			},
			devDependencies: {
				"msr-test-c": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.0-dev.2",
				"msr-test-d": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/dist/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.0-dev.2",
				"msr-test-d": "1.0.0-dev.2",
			},
		});
		expect(require(`${cwd}/dist/d/package.json`)).toEqual({
			name: "msr-test-d",
			version: "0.0.0",
		});
	}, 10000);
	test("No changes in any packages", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha = gitCommitAll(cwd, "feat: Initial release");
		// Creating the four tags so there are no changes in any packages.
		gitTag(cwd, "msr-test-a@1.0.0");
		gitTag(cwd, "msr-test-b@1.0.0");
		gitTag(cwd, "msr-test-c@1.0.0");
		gitTag(cwd, "msr-test-d@1.0.0");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[
				`packages/c/package.json`,
				`packages/a/package.json`,
				`packages/d/package.json`,
				`packages/b/package.json`,
			],
			{},
			{ cwd, stdout, stderr, env }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 4 packages! Starting release...");
		expect(out).toMatch("There are no relevant changes, so no new version is released");
		expect(out).not.toMatch("Created tag");
		expect(out).toMatch("Released 0 of 4 packages, semantically!");

		// Results.
		expect(result[0].result).toBe(false);
		expect(result[1].result).toBe(false);
		expect(result[2].result).toBe(false);
		expect(result[3].result).toBe(false);
		expect(result).toHaveLength(4);
	});
	test("Changes in some packages", async () => {
		// Create Git repo.
		const cwd = gitInit();
		// Initial commit.
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitTag(cwd, "msr-test-a@1.0.0");
		gitTag(cwd, "msr-test-b@1.0.0");
		gitTag(cwd, "msr-test-c@1.0.0");
		gitTag(cwd, "msr-test-d@1.0.0");
		// Second commit.
		writeFileSync(`${cwd}/packages/a/aaa.txt`, "AAA");
		const sha2 = gitCommitAll(cwd, "feat(aaa): Add missing text file");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[
				`packages/c/package.json`,
				`packages/d/package.json`,
				`packages/b/package.json`,
				`packages/a/package.json`,
			],
			{},
			{ cwd, stdout, stderr, env },
			{ deps: {}, dryRun: false }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Loaded package msr-test-c");
		expect(out).toMatch("Loaded package msr-test-d");
		expect(out).toMatch("Queued 4 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-a@1.1.0");
		expect(out).toMatch("Created tag msr-test-b@1.0.1");
		expect(out).toMatch("Created tag msr-test-c@1.0.1");
		expect(out).toMatch("There are no relevant changes, so no new version is released");
		expect(out).toMatch("Released 3 of 4 packages, semantically!");

		// A.
		expect(result[3].name).toBe("msr-test-a");
		expect(result[3].result.lastRelease).toMatchObject({
			gitHead: sha1,
			gitTag: "msr-test-a@1.0.0",
			version: "1.0.0",
		});
		expect(result[3].result.nextRelease).toMatchObject({
			gitHead: sha2,
			gitTag: "msr-test-a@1.1.0",
			type: "minor",
			version: "1.1.0",
		});
		expect(result[3].result.nextRelease.notes).toMatch("# msr-test-a [1.1.0]");
		expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* **aaa:** Add missing text file");
		expect(result[3].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.1");

		// B.
		expect(result[2].name).toBe("msr-test-b");
		expect(result[2].result.lastRelease).toEqual({
			channels: [null],
			gitHead: sha1,
			gitTag: "msr-test-b@1.0.0",
			name: "msr-test-b@1.0.0",
			version: "1.0.0",
		});
		expect(result[2].result.nextRelease).toMatchObject({
			gitHead: sha2,
			gitTag: "msr-test-b@1.0.1",
			type: "patch",
			version: "1.0.1",
		});
		expect(result[2].result.nextRelease.notes).toMatch("# msr-test-b [1.0.1]");
		expect(result[2].result.nextRelease.notes).not.toMatch("### Features");
		expect(result[2].result.nextRelease.notes).not.toMatch("### Bug Fixes");
		expect(result[2].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-a:** upgraded to 1.1.0");

		// C.
		expect(result[0].name).toBe("msr-test-c");
		expect(result[0].result.lastRelease).toEqual({
			channels: [null],
			gitHead: sha1,
			gitTag: "msr-test-c@1.0.0",
			name: "msr-test-c@1.0.0",
			version: "1.0.0",
		});
		expect(result[0].result.nextRelease).toMatchObject({
			gitHead: sha2,
			gitTag: "msr-test-c@1.0.1",
			type: "patch",
			version: "1.0.1",
		});
		expect(result[0].result.nextRelease.notes).toMatch("# msr-test-c [1.0.1]");
		expect(result[0].result.nextRelease.notes).not.toMatch("### Features");
		expect(result[0].result.nextRelease.notes).not.toMatch("### Bug Fixes");
		expect(result[0].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.1");

		// D.
		expect(result[1].name).toBe("msr-test-d");
		expect(result[1].result).toBe(false);

		// ONLY four times.
		expect(result[4]).toBe(undefined);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.1",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.1.0",
			},
			devDependencies: {
				"msr-test-c": "1.0.1",
			},
		});
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.1",
				"msr-test-d": "1.0.0",
			},
		});
	});
	test("Changes in some packages (sequential-init)", async () => {
		// Create Git repo.
		const cwd = gitInit();
		// Initial commit.
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitTag(cwd, "msr-test-a@1.0.0");
		gitTag(cwd, "msr-test-b@1.0.0");
		gitTag(cwd, "msr-test-c@1.0.0");
		gitTag(cwd, "msr-test-d@1.0.0");
		// Second commit.
		writeFileSync(`${cwd}/packages/a/aaa.txt`, "AAA");
		const sha2 = gitCommitAll(cwd, "feat(aaa): Add missing text file");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[
				`packages/c/package.json`,
				`packages/d/package.json`,
				`packages/b/package.json`,
				`packages/a/package.json`,
			],
			{},
			{ cwd, stdout, stderr, env },
			{ sequentialInit: true, deps: {} }
		);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			peerDependencies: {
				"msr-test-c": "1.0.1",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.1.0",
			},
			devDependencies: {
				"msr-test-c": "1.0.1",
			},
		});
		expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
			devDependencies: {
				"msr-test-b": "1.0.1",
				"msr-test-d": "1.0.0",
			},
		});
	});
	test("Error if release's local deps have no version number", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		gitAdd(cwd, "packages/a/package.json");
		const sha = gitCommit(cwd, "feat: Commit first package only");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		try {
			const multiSemanticRelease = require("../../");
			const result = await multiSemanticRelease(
				[`packages/a/package.json`, `packages/c/package.json`],
				{},
				{ cwd, stdout, stderr, env }
			);

			// Not reached.
			expect(false).toBe(true);
		} catch (e) {
			expect(e.message).toBe("Cannot release because dependency msr-test-c has not been released");
		}
	});
	test("Configured plugins are called as normal", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha = gitCommitAll(cwd, "feat: Initial release");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Make an inline plugin.
		const plugin = {
			verifyConditions: jest.fn(),
			analyzeCommits: jest.fn(),
			verifyRelease: jest.fn(),
			generateNotes: jest.fn(),
			prepare: jest.fn(),
			success: jest.fn(),
			fail: jest.fn(),
		};

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[`packages/d/package.json`],
			{
				// Override to add our own plugins.
				plugins: ["@semantic-release/release-notes-generator", plugin],
				analyzeCommits: ["@semantic-release/commit-analyzer"],
			},
			{ cwd, stdout, stderr, env }
		);

		// Check calls.
		expect(plugin.verifyConditions).toBeCalledTimes(1);
		expect(plugin.analyzeCommits).toBeCalledTimes(0); // NOTE overridden
		expect(plugin.verifyRelease).toBeCalledTimes(1);
		expect(plugin.generateNotes).toBeCalledTimes(1);
		expect(plugin.prepare).toBeCalledTimes(1);
		expect(plugin.success).toBeCalledTimes(1);
		expect(plugin.fail).not.toBeCalled();
	});
	test("Package-specific configuration overrides global configuration", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/packageOptions/`, cwd);
		// Create a docs commit that should be a patch release with package B's config
		const sha = gitCommitAll(cwd, "docs: testing");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		const multiSemanticRelease = require("../../");
		const [aResult, bResult] = await multiSemanticRelease(
			[`packages/a/package.json`, `packages/b/package.json`],
			{},
			{ cwd, stdout, stderr, env }
		);

		// Check no stderr
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);

		// A: no releases
		expect(aResult.result).toBe(false);

		// B: patch release
		expect(bResult.result.nextRelease.type).toBe("patch");
	});
	test("Deep errors (e.g. in plugins) bubble up and out", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha = gitCommitAll(cwd, "feat: Initial release");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Release.
		const multiSemanticRelease = require("../../");

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		try {
			await multiSemanticRelease(
				[`packages/d/package.json`, `packages/a/package.json`],
				{
					// Override to add our own erroring plugin.
					plugins: [
						{
							analyzeCommits: () => {
								throw new Error("NOPE");
							},
						},
					],
				},
				{ cwd, stdout, stderr, env }
			);

			// Not reached.
			expect(false).toBe(true);
		} catch (e) {
			// Error bubbles up through semantic-release and multi-semantic-release and out.
			expect(e.message).toBe("NOPE");
		}
	});
	test("TypeError if CWD is not string", async () => {
		const multiSemanticRelease = require("../../");
		await expect(multiSemanticRelease()).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease(undefined)).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease(null)).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([1, 2, 3])).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([true, false])).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([undefined])).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([null])).rejects.toBeInstanceOf(TypeError);
	});
	test("TypeError if paths is not a list of strings", async () => {
		const multiSemanticRelease = require("../../");
		await expect(multiSemanticRelease()).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease(undefined)).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease(null)).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([1, 2, 3])).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([true, false])).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([undefined])).rejects.toBeInstanceOf(TypeError);
		await expect(multiSemanticRelease([null])).rejects.toBeInstanceOf(TypeError);
	});
	test("ReferenceError if paths points to a non-file", async () => {
		const multiSemanticRelease = require("../../");
		const stdout = new WritableStreamBuffer(); // Blackhole the output so it doesn't clutter Jest.
		const r1 = multiSemanticRelease(["test/fixtures/DOESNOTEXIST.json"], {}, { stdout });
		await expect(r1).rejects.toBeInstanceOf(ReferenceError); // Path that does not exist.
		const r2 = multiSemanticRelease(["test/fixtures/DOESNOTEXIST/"], {}, { stdout });
		await expect(r2).rejects.toBeInstanceOf(ReferenceError); // Path that does not exist.
		const r3 = multiSemanticRelease(["test/fixtures/"], {}, { stdout });
		await expect(r3).rejects.toBeInstanceOf(ReferenceError); // Directory that exists.
	});
	test("SyntaxError if paths points to package.json with bad syntax", async () => {
		const multiSemanticRelease = require("../../");
		const stdout = new WritableStreamBuffer(); // Blackhole the output so it doesn't clutter Jest.
		const r1 = multiSemanticRelease(["test/fixtures/invalidPackage.json"], {}, { stdout });
		await expect(r1).rejects.toBeInstanceOf(SyntaxError);
		await expect(r1).rejects.toMatchObject({
			message: expect.stringMatching("could not be parsed"),
		});
		const r2 = multiSemanticRelease(["test/fixtures/numberPackage.json"], {}, { stdout });
		await expect(r2).rejects.toBeInstanceOf(SyntaxError);
		await expect(r2).rejects.toMatchObject({
			message: expect.stringMatching("not an object"),
		});
		const r3 = multiSemanticRelease(["test/fixtures/badNamePackage.json"], {}, { stdout });
		await expect(r3).rejects.toBeInstanceOf(SyntaxError);
		await expect(r3).rejects.toMatchObject({
			message: expect.stringMatching("Package name must be non-empty string"),
		});
		const r4 = multiSemanticRelease(["test/fixtures/badDepsPackage.json"], {}, { stdout });
		await expect(r4).rejects.toBeInstanceOf(SyntaxError);
		await expect(r4).rejects.toMatchObject({
			message: expect.stringMatching("Package dependencies must be object"),
		});
		const r5 = multiSemanticRelease(["test/fixtures/badDevDepsPackage.json"], {}, { stdout });
		await expect(r5).rejects.toBeInstanceOf(SyntaxError);
		await expect(r5).rejects.toMatchObject({
			message: expect.stringMatching("Package devDependencies must be object"),
		});
		const r6 = multiSemanticRelease(["test/fixtures/badPeerDepsPackage.json"], {}, { stdout });
		await expect(r6).rejects.toBeInstanceOf(SyntaxError);
		await expect(r6).rejects.toMatchObject({
			message: expect.stringMatching("Package peerDependencies must be object"),
		});
	});

	test("Changes in packages with mutual dependency", async () => {
		// Create Git repo.
		const cwd = gitInit();
		// Initial commit.
		copyDirectory(`test/fixtures/yarnWorkspacesMutualDependency/`, cwd);
		const sha1 = gitCommitAll(cwd, "feat: Initial release");
		gitTag(cwd, "msr-test-a@1.0.0");
		gitTag(cwd, "msr-test-b@1.0.0");
		// Second commit.
		writeFileSync(`${cwd}/packages/a/aaa.txt`, "AAA");
		const sha2 = gitCommitAll(cwd, "feat(aaa): Add missing text file");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Capture output.
		const stdout = new WritableStreamBuffer();
		const stderr = new WritableStreamBuffer();

		// Call multiSemanticRelease()
		// Doesn't include plugins that actually publish.
		const multiSemanticRelease = require("../../");
		const result = await multiSemanticRelease(
			[`packages/a/package.json`, `packages/b/package.json`],
			{},
			{ cwd, stdout, stderr, env },
			{ deps: { bump: "satisfy" }, dryRun: false }
		);

		// Get stdout and stderr output.
		const err = stderr.getContentsAsString("utf8");
		expect(err).toBe(false);
		const out = stdout.getContentsAsString("utf8");
		expect(out).toMatch("Started multirelease! Loading 2 packages...");
		expect(out).toMatch("Loaded package msr-test-a");
		expect(out).toMatch("Loaded package msr-test-b");
		expect(out).toMatch("Queued 2 packages! Starting release...");
		expect(out).toMatch("Created tag msr-test-a@1.1.0");
		expect(out).toMatch("Created tag msr-test-b@1.0.1");
		expect(out).toMatch("Released 2 of 2 packages, semantically!");

		const a = 0;
		const b = 1;
		// A.
		expect(result[a].name).toBe("msr-test-a");
		expect(result[a].result.lastRelease).toMatchObject({
			gitHead: sha1,
			gitTag: "msr-test-a@1.0.0",
			version: "1.0.0",
		});
		expect(result[a].result.nextRelease).toMatchObject({
			gitHead: sha2,
			gitTag: "msr-test-a@1.1.0",
			type: "minor",
			version: "1.1.0",
		});
		expect(result[a].result.nextRelease.notes).toMatch("# msr-test-a [1.1.0]");
		expect(result[a].result.nextRelease.notes).toMatch("### Features\n\n* **aaa:** Add missing text file");
		expect(result[a].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.1");

		// B.
		expect(result[b].name).toBe("msr-test-b");
		expect(result[b].result.lastRelease).toEqual({
			channels: [null],
			gitHead: sha1,
			gitTag: "msr-test-b@1.0.0",
			name: "msr-test-b@1.0.0",
			version: "1.0.0",
		});
		expect(result[b].result.nextRelease).toMatchObject({
			gitHead: sha2,
			gitTag: "msr-test-b@1.0.1",
			type: "patch",
			version: "1.0.1",
		});
		expect(result[b].result.nextRelease.notes).toMatch("# msr-test-b [1.0.1]");
		expect(result[b].result.nextRelease.notes).not.toMatch("### Features");
		expect(result[b].result.nextRelease.notes).not.toMatch("### Bug Fixes");
		expect(result[b].result.nextRelease.notes).toMatch("### Dependencies\n\n* **msr-test-a:** upgraded to 1.1.0");

		// ONLY 3 times.
		expect(result[2]).toBe(undefined);

		// Check manifests.
		expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-b": "1.0.1",
			},
		});
		expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
			dependencies: {
				"msr-test-a": "1.1.0",
			},
		});
	});
	describe("With private packages", () => {
		test("should not ignore private packages by default", async () => {
			// Create Git repo with copy of Yarn workspaces fixture.
			const cwd = gitInit();
			copyDirectory(`test/fixtures/yarnWorkspacesPrivatePackage/`, cwd);
			const sha = gitCommitAll(cwd, "feat: Initial release");
			const url = gitInitOrigin(cwd);
			gitPush(cwd);

			// Capture output.
			const stdout = new WritableStreamBuffer();
			const stderr = new WritableStreamBuffer();

			// Call multiSemanticRelease()
			// Doesn't include plugins that actually publish.
			const multiSemanticRelease = require("../../");
			const result = await multiSemanticRelease(
				[
					`packages/a/package.json`,
					`packages/b/package.json`,
					`packages/c/package.json`,
					`packages/d/package.json`,
					`packages/e/package.json`,
				],
				{},
				{ cwd, stdout, stderr, env }
			);

			// Get stdout and stderr output.
			const err = stderr.getContentsAsString("utf8");
			expect(err).toBe(false);
			const out = stdout.getContentsAsString("utf8");
			expect(out).toMatch("Started multirelease! Loading 5 packages...");
			expect(out).toMatch("Loaded package msr-test-a");
			expect(out).toMatch("Loaded package msr-test-b");
			expect(out).toMatch("Loaded package msr-test-c");
			expect(out).toMatch("Loaded package msr-test-d");
			expect(out).toMatch("Loaded package msr-test-e");
			expect(out).toMatch("Queued 5 packages! Starting release...");
			expect(out).toMatch("Created tag msr-test-a@1.0.0");
			expect(out).toMatch("Created tag msr-test-b@1.0.0");
			expect(out).toMatch("Created tag msr-test-c@1.0.0");
			expect(out).toMatch("Created tag msr-test-d@1.0.0");
			expect(out).toMatch("Created tag msr-test-e@1.0.0");
			expect(out).toMatch("Released 5 of 5 packages, semantically!");

			// A.
			expect(result[0].name).toBe("msr-test-a");
			expect(result[0].result.lastRelease).toEqual({});
			expect(result[0].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-a@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a 1.0.0");
			expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[0].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// B.
			expect(result[1].name).toBe("msr-test-b");
			expect(result[1].result.lastRelease).toEqual({});
			expect(result[1].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-b@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b 1.0.0");
			expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[1].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// C.
			expect(result[2].name).toBe("msr-test-c");
			expect(result[2].result.lastRelease).toEqual({});
			expect(result[2].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-c@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c 1.0.0");
			expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[2].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0"
			);

			// D.
			expect(result[3].name).toBe("msr-test-d");
			expect(result[3].result.lastRelease).toEqual({});
			expect(result[3].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-d@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d 1.0.0");
			expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

			// E.
			expect(result[4].name).toBe("msr-test-e");
			expect(result[4].result.lastRelease).toEqual({});
			expect(result[4].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-e@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[4].result.nextRelease.notes).toMatch("# msr-test-e 1.0.0");
			expect(result[4].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[4].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// ONLY five times.
			expect(result).toHaveLength(5);

			// Check manifests.
			expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
				peerDependencies: {
					"msr-test-c": "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
				dependencies: {
					"msr-test-a": "1.0.0",
				},
				devDependencies: {
					"msr-test-c": "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
				devDependencies: {
					"msr-test-b": "1.0.0",
					"msr-test-d": "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/e/package.json`)).toMatchObject({
				peerDependencies: {
					"msr-test-c": "1.0.0",
				},
			});
		});
		test("should ignore private packages by when ", async () => {
			// Create Git repo with copy of Yarn workspaces fixture.
			const cwd = gitInit();
			copyDirectory(`test/fixtures/yarnWorkspacesPrivatePackage/`, cwd);
			const sha = gitCommitAll(cwd, "feat: Initial release");
			const url = gitInitOrigin(cwd);
			gitPush(cwd);

			// Capture output.
			const stdout = new WritableStreamBuffer();
			const stderr = new WritableStreamBuffer();

			// Call multiSemanticRelease()
			// Doesn't include plugins that actually publish.
			const multiSemanticRelease = require("../../");
			const result = await multiSemanticRelease(
				[
					`packages/a/package.json`,
					`packages/b/package.json`,
					`packages/c/package.json`,
					`packages/d/package.json`,
					`packages/e/package.json`,
				],
				{},
				{ cwd, stdout, stderr, env },
				{ ignorePrivatePackages: true, deps: {} }
			);

			// Get stdout and stderr output.
			const err = stderr.getContentsAsString("utf8");
			expect(err).toBe(false);
			const out = stdout.getContentsAsString("utf8");
			expect(out).toMatch("Started multirelease! Loading 5 packages...");
			expect(out).toMatch("Loaded package msr-test-a");
			expect(out).toMatch("Loaded package msr-test-b");
			expect(out).toMatch("Loaded package msr-test-c");
			expect(out).toMatch("Loaded package msr-test-d");
			expect(out).toMatch("[msr-test-e] is private, will be ignored");
			expect(out).toMatch("Queued 4 packages! Starting release...");
			expect(out).toMatch("Created tag msr-test-a@1.0.0");
			expect(out).toMatch("Created tag msr-test-b@1.0.0");
			expect(out).toMatch("Created tag msr-test-c@1.0.0");
			expect(out).toMatch("Created tag msr-test-d@1.0.0");
			expect(out).toMatch("Released 4 of 4 packages, semantically!");

			// A.
			expect(result[0].name).toBe("msr-test-a");
			expect(result[0].result.lastRelease).toEqual({});
			expect(result[0].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-a@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a 1.0.0");
			expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[0].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// B.
			expect(result[1].name).toBe("msr-test-b");
			expect(result[1].result.lastRelease).toEqual({});
			expect(result[1].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-b@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b 1.0.0");
			expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[1].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// C.
			expect(result[2].name).toBe("msr-test-c");
			expect(result[2].result.lastRelease).toEqual({});
			expect(result[2].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-c@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c 1.0.0");
			expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[2].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0"
			);

			// D.
			expect(result[3].name).toBe("msr-test-d");
			expect(result[3].result.lastRelease).toEqual({});
			expect(result[3].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-d@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d 1.0.0");
			expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

			// ONLY four times.
			expect(result).toHaveLength(4);

			// Check manifests.
			expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
				peerDependencies: {
					"msr-test-c": "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
				dependencies: {
					"msr-test-a": "1.0.0",
				},
				devDependencies: {
					"msr-test-c": "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
				devDependencies: {
					"msr-test-b": "1.0.0",
					"msr-test-d": "1.0.0",
				},
			});
		});
	});
	describe.each([
		["override", "yarnWorkspacesPackagesCarret", "^"],
		["override", "yarnWorkspacesPackages", "~"],
		["inherit", "yarnWorkspacesPackagesCarret", "^"],
	])("With deps.bump=%s & deps.prefix=%s & fixture=%s", (strategy, fixtureName, prefix) => {
		test("should bump with deps.prefix", async () => {
			// Create Git repo with copy of Yarn workspaces fixture.
			const cwd = gitInit();
			copyDirectory(`test/fixtures/${fixtureName}/`, cwd);
			const sha = gitCommitAll(cwd, "feat: Initial release");
			gitInitOrigin(cwd);
			gitPush(cwd);

			// Capture output.
			const stdout = new WritableStreamBuffer();
			const stderr = new WritableStreamBuffer();

			// Call multiSemanticRelease()
			// Doesn't include plugins that actually publish.
			const multiSemanticRelease = require("../../");
			const result = await multiSemanticRelease(
				[
					`packages/a/package.json`,
					`packages/b/package.json`,
					`packages/c/package.json`,
					`packages/d/package.json`,
				],
				{},
				{ cwd, stdout, stderr, env },
				{ deps: { bump: strategy, prefix } }
			);

			// Get stdout and stderr output.
			const err = stderr.getContentsAsString("utf8");
			expect(err).toBe(false);
			const out = stdout.getContentsAsString("utf8");
			expect(out).toMatch("Started multirelease! Loading 4 packages...");
			expect(out).toMatch("Loaded package msr-test-a");
			expect(out).toMatch("Loaded package msr-test-b");
			expect(out).toMatch("Loaded package msr-test-c");
			expect(out).toMatch("Loaded package msr-test-d");
			expect(out).toMatch("Queued 4 packages! Starting release...");
			expect(out).toMatch("Created tag msr-test-a@1.0.0");
			expect(out).toMatch("Created tag msr-test-b@1.0.0");
			expect(out).toMatch("Created tag msr-test-c@1.0.0");
			expect(out).toMatch("Created tag msr-test-d@1.0.0");
			expect(out).toMatch("Released 4 of 4 packages, semantically!");

			// A.
			expect(result[0].name).toBe("msr-test-a");
			expect(result[0].result.lastRelease).toEqual({});
			expect(result[0].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-a@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a 1.0.0");
			expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[0].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// B.
			expect(result[1].name).toBe("msr-test-b");
			expect(result[1].result.lastRelease).toEqual({});
			expect(result[1].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-b@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b 1.0.0");
			expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[1].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// C.
			expect(result[2].name).toBe("msr-test-c");
			expect(result[2].result.lastRelease).toEqual({});
			expect(result[2].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-c@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c 1.0.0");
			expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[2].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0"
			);

			// D.
			expect(result[3].name).toBe("msr-test-d");
			expect(result[3].result.lastRelease).toEqual({});
			expect(result[3].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-d@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d 1.0.0");
			expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[3].result.nextRelease.notes).not.toMatch("### Dependencies");

			// ONLY four times.
			expect(result).toHaveLength(4);

			// Check manifests.
			expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
				peerDependencies: {
					"msr-test-c": strategy === "inherit" ? "^1.0.0" : prefix + "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
				dependencies: {
					"msr-test-a": strategy === "inherit" ? "^1.0.0" : prefix + "1.0.0",
				},
				devDependencies: {
					"msr-test-c": strategy === "inherit" ? "^1.0.0" : prefix + "1.0.0",
				},
			});
			expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
				devDependencies: {
					"msr-test-b": strategy === "inherit" ? "^1.0.0" : prefix + "1.0.0",
					"msr-test-d": strategy === "inherit" ? "^1.0.0" : prefix + "1.0.0",
				},
			});
		});
	});
	describe.each([
		["override", "^"],
		["satisfy", "^"],
		["inherit", "^"],
	])("With Yarn Workspace Ranges & deps.bump=%s & deps.prefix=%s", (strategy, prefix) => {
		test('should replace "workspace:" with correct version', async () => {
			// Create Git repo with copy of Yarn workspaces fixture.
			const cwd = gitInit();
			copyDirectory(`test/fixtures/yarnWorkspacesRanges/`, cwd);
			const sha = gitCommitAll(cwd, "feat: Initial release");
			gitInitOrigin(cwd);
			gitPush(cwd);

			// Capture output.
			const stdout = new WritableStreamBuffer();
			const stderr = new WritableStreamBuffer();

			// Call multiSemanticRelease()
			// Doesn't include plugins that actually publish.
			const multiSemanticRelease = require("../../");
			const result = await multiSemanticRelease(
				[
					`packages/a/package.json`,
					`packages/b/package.json`,
					`packages/c/package.json`,
					`packages/d/package.json`,
				],
				{},
				{ cwd, stdout, stderr, env },
				{ deps: { bump: strategy, prefix } }
			);

			// Get stdout and stderr output.
			const err = stderr.getContentsAsString("utf8");
			expect(err).toBe(false);
			const out = stdout.getContentsAsString("utf8");
			expect(out).toMatch("Started multirelease! Loading 4 packages...");
			expect(out).toMatch("Loaded package msr-test-a");
			expect(out).toMatch("Loaded package msr-test-b");
			expect(out).toMatch("Loaded package msr-test-c");
			expect(out).toMatch("Loaded package msr-test-d");
			expect(out).toMatch("Queued 4 packages! Starting release...");
			expect(out).toMatch("Created tag msr-test-a@1.0.0");
			expect(out).toMatch("Created tag msr-test-b@1.0.0");
			expect(out).toMatch("Created tag msr-test-c@1.0.0");
			expect(out).toMatch("Created tag msr-test-d@1.0.0");
			expect(out).toMatch("Released 4 of 4 packages, semantically!");

			// A.
			expect(result[0].name).toBe("msr-test-a");
			expect(result[0].result.lastRelease).toEqual({});
			expect(result[0].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-a@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[0].result.nextRelease.notes).toMatch("# msr-test-a 1.0.0");
			expect(result[0].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[0].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-b:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0"
			);

			// B.
			expect(result[1].name).toBe("msr-test-b");
			expect(result[1].result.lastRelease).toEqual({});
			expect(result[1].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-b@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[1].result.nextRelease.notes).toMatch("# msr-test-b 1.0.0");
			expect(result[1].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");
			expect(result[1].result.nextRelease.notes).toMatch(
				"### Dependencies\n\n* **msr-test-d:** upgraded to 1.0.0"
			);

			// C.
			expect(result[2].name).toBe("msr-test-c");
			expect(result[2].result.lastRelease).toEqual({});
			expect(result[2].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-c@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[2].result.nextRelease.notes).toMatch("# msr-test-c 1.0.0");
			expect(result[2].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");

			// D.
			expect(result[3].name).toBe("msr-test-d");
			expect(result[3].result.lastRelease).toEqual({});
			expect(result[3].result.nextRelease).toMatchObject({
				gitHead: sha,
				gitTag: "msr-test-d@1.0.0",
				type: "minor",
				version: "1.0.0",
			});
			expect(result[3].result.nextRelease.notes).toMatch("# msr-test-d 1.0.0");
			expect(result[3].result.nextRelease.notes).toMatch("### Features\n\n* Initial release");

			// ONLY four times.
			expect(result).toHaveLength(4);

			// Check manifests.
			expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
				dependencies: {
					"msr-test-b": "1.0.0",
				},
				devDependencies: {
					"msr-test-c": strategy === "override" ? prefix + "1.0.0" : "^1.0.0",
				},
				peerDependencies: {
					"msr-test-d": strategy === "override" ? prefix + "1.0.0" : "~1.0.0",
				},
			});
			expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
				optionalDependencies: {
					"msr-test-d": strategy === "override" ? prefix + "1.0.0" : "^1.0.0",
				},
			});
		});
	});
});

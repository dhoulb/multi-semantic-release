const tempy = require("tempy");
const { WritableStreamBuffer } = require("stream-buffers");
const { copyDirectory, createNewTestingFiles } = require("../helpers/file");
const { gitInit, gitCommitAll, gitInitOrigin, gitPush } = require("../helpers/git");
const { getTags } = require("../../lib/git");

test("Fetch all tags on master after two package release", async () => {
	const packages = ["packages/c/", "packages/d/"];

	// Create Git repo with copy of Yarn workspaces fixture.
	const cwd = gitInit("master", "release");
	copyDirectory(`test/fixtures/yarnWorkspaces2Packages/`, cwd);
	const sha1 = gitCommitAll(cwd, "feat: Initial release");
	gitInitOrigin(cwd, "release");
	gitPush(cwd);

	const stdout = new WritableStreamBuffer();
	const stderr = new WritableStreamBuffer();

	// Call multiSemanticRelease()
	// Doesn't include plugins that actually publish.
	const multiSemanticRelease = require("../../");
	await multiSemanticRelease(
		packages.map((folder) => `${folder}package.json`),
		{
			branches: [{ name: "master" }, { name: "release" }],
		},
		{ cwd, stdout, stderr }
	);

	const tags = getTags("master", { cwd }).sort();
	expect(tags).toEqual(["msr-test-d@1.0.0", "msr-test-c@1.0.0"].sort());
});

test("Fetch only prerelease tags", async () => {
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
	await multiSemanticRelease(
		packages.map((folder) => `${folder}package.json`),
		{
			branches: [{ name: "master" }, { name: "release" }],
		},
		{ cwd, stdout, stderr }
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
	await multiSemanticRelease(
		packages.map((folder) => `${folder}package.json`),
		{
			branches: [{ name: "master", prerelease: "beta" }, { name: "release" }],
		},
		{ cwd, stdout, stderr }
	);

	const tags = getTags("master", { cwd }, ["beta"]).sort();
	expect(tags).toEqual(["msr-test-d@2.0.0-beta.1", "msr-test-c@2.0.0-beta.1"].sort());
});

test("Throws error if obtaining the tags fails", () => {
	const cwd = tempy.directory();

	const t = () => {
		getTags("master", { cwd });
	};
	expect(t).toThrow(Error);
});

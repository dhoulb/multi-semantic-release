const execa = require("execa");
const { copyDirectory } = require("../helpers/file");
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

// Tests.
describe("multi-semantic-release CLI", () => {
	test("Initial commit (changes in all packages)", async () => {
		// Create Git repo with copy of Yarn workspaces fixture.
		const cwd = gitInit();
		copyDirectory(`test/fixtures/yarnWorkspaces/`, cwd);
		const sha = gitCommitAll(cwd, "feat: Initial release");
		const url = gitInitOrigin(cwd);
		gitPush(cwd);

		// Path to CLI command.
		const filepath = `${__dirname}/../../bin/cli.js`;

		// Run via command line.
		const out = (await execa("node", [filepath], { cwd })).stdout;
		expect(out).toMatch("Started multirelease! Loading 4 packages...");
		expect(out).toMatch("Released 4 of 4 packages, semantically!");
	});
});

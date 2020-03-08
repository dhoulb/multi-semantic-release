const get = require("lodash.get");

module.exports = flags => {
	const getLogger = require("../lib/getLogger");
	const logger = getLogger({ stdout: process.stdout, stderr: process.stderr });
	const debug = require("../lib/debug");

	logger.log("flags=", flags);

	debug.config(flags.debug);

	if (flags.watchspawn || get(flags, "debug.spawn")) {
		require("../lib/spawnHook").hook();
	}

	// Execa hook.
	if (flags.sync) {
		require("../lib/execaHook").hook();
	}

	// Imports.
	const getWorkspacesYarn = require("../lib/getWorkspacesYarn");
	const multiSemanticRelease = require("../lib/multiSemanticRelease");

	// Get directory.
	const cwd = process.cwd();

	// Catch errors.
	try {
		// Get list of package.json paths according to Yarn workspaces.
		const paths = getWorkspacesYarn(cwd);
		console.log("yarn paths", paths);

		// Do multirelease (log out any errors).
		multiSemanticRelease(paths, {}, { cwd }).then(
			() => {
				// Success.
				process.exit(0);
			},
			error => {
				// Log out errors.
				console.error(`[multi-semantic-release]:`, error);
				process.exit(1);
			}
		);
	} catch (error) {
		// Log out errors.
		console.error(`[multi-semantic-release]:`, error);
		process.exit(1);
	}
};

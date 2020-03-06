const get = require("lodash.get");

module.exports = flags => {
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

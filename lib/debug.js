const get = require("lodash.get");

let opts;

const createDebugger = prefix => (...input) => {
	const getLogger = require("./getLogger");
	const logger = getLogger({ stdout: process.stdout, stderr: process.stderr });

	// if (get(opts, prefix || "")) {
	console.log(...input);
	return logger.log(...input);
	// }
};

const debug = createDebugger();
debug.config = flags => (opts = flags);
debug.create = createDebugger;

module.exports = debug;

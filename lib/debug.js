const get = require("lodash.get");
const getLogger = require("./getLogger");

let opts;

const createDebugger = prefix => (...input) => {
	const logger = getLogger({ stdout: process.stdout, stderr: process.stderr });

	// if (get(opts, prefix || "")) {
	console.log(prefix, ...input);
	return logger.log(prefix, ...input);
	// }
};

const debug = createDebugger();
debug.config = flags => (opts = flags);
debug.create = createDebugger;

module.exports = debug;

const get = require("lodash.get");
const getLogger = require("./getLogger");
const logger = getLogger({ stdout: process.stdout, stderr: process.stderr });

let opts;

const createDebugger = prefix => (...input) => {
	if (get(opts, prefix || "")) {
		return logger.log(...input);
	}
};

const debug = createDebugger();
debug.config = flags => (opts = flags);
debug.create = createDebugger;

module.exports = debug;

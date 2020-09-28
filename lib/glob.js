const bashGlob = require("bash-glob");
const bashPath = require("bash-path");

module.exports = (...args) => {
	if (!bashPath) {
		throw new TypeError("`bash` must be installed"); // TODO move this check to bash-glob
	}

	return bashGlob.sync(...args);
};

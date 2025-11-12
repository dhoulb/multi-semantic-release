const api = {
	semanticGetConfig() {
		throw new Error("NOT_FOUND: semantic-release/lib/get-config");
	},
	semanticRelease() {
		throw new Error("NOT_FOUND: semantic-release");
	},
};

try {
	api.semanticGetConfig = require("semantic-release/lib/get-config");
	api.semanticRelease = require("semantic-release");
} catch (e) {
	console.debug("NOT_FOUND: CJS semantic-release or its get-config module");
}

module.exports = api;

const api = (globalThis.__msr__ = globalThis.__msr__ || {});

if (!api.semanticRelease) {
	try {
		api.semanticGetConfig = require("semantic-release/lib/get-config");
		api.semanticRelease = require("semantic-release");
	} catch (e) {
		api.semanticGetConfig = () => {
			throw new Error("NOT_FOUND: semantic-release/lib/get-config");
		};
		api.semanticRelease = () => {
			throw new Error("NOT_FOUND: semantic-release");
		};
		console.debug("NOT_FOUND: CJS semantic-release or its get-config module");
	}
}

module.exports = api;

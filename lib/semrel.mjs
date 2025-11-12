import { createRequire } from 'node:module'

const require = createRequire(import.meta.url);
const semrel = require('./semrel.js');

try {
	semrel.semanticRelease = await import('semantic-release');
	semrel.semanticGetConfig = await import('semantic-release/lib/get-config.js');
} catch (e) {
	console.debug("NOT_FOUND: ESM semantic-release or its get-config module")
}

import { createRequire } from 'node:module'
import path from 'node:path'
import url from 'node:url'

const require = createRequire(import.meta.url);
const api = (globalThis.__msr__ = (globalThis.__msr__ || {}));

/**
 This dirty trick is needed to make our old good MSR commonjs code compatible
 with modern ESM semantic-release versions (>=25). The fragile wrapper can break
 with the slightest change in conditions. Perhaps someone will find the time,
 energy and desire to overwrite the project completely as it should be done.
 I apologize for the additional complexity and inconvenience caused by this part,
 and I sincerely wish the best of luck in refactoring.

 https://github.com/dhoulb/multi-semantic-release/pull/160
 */
try {
	const msrRoot = path.dirname(require.resolve('semantic-release'));
	api.semanticRelease = (await import('semantic-release')).default;
	api.semanticGetConfig = (await import(url.pathToFileURL(path.join(msrRoot, 'lib', 'get-config.js')).href)).default;
} catch (e) {
	console.debug("NOT_FOUND: ESM semantic-release or its get-config module")
}

export default api;
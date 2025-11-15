import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url);
const api = (globalThis.__msr__ = (globalThis.__msr__ || {}));

try {
	const msrRoot = path.dirname(require.resolve('semantic-release'));
	api.semanticRelease = (await import('semantic-release')).default
	api.semanticGetConfig = (await import(`file://${msrRoot}/lib/get-config.js`)).default
} catch (e) {
	console.debug("NOT_FOUND: ESM semantic-release or its get-config module", e)
}

console.log('!!! esm', api)

export default api;
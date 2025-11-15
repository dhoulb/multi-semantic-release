import { createRequire } from 'node:module'
import path from 'node:path'


if (!globalThis.__msr__) {
	const require = createRequire(import.meta.url);
	const api = {};

	try {
		const msrRoot = path.dirname(require.resolve('semantic-release'));
		api.semanticRelease = (await import('semantic-release')).default;
		api.semanticGetConfig = (await import(`file://${msrRoot}/lib/get-config.js`)).default;
		globalThis.__msr__ = api
	} catch (e) {
		console.debug("NOT_FOUND: ESM semantic-release or its get-config module", e)
	}
}

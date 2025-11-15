(async () => {
	const api = (await import('../../lib/semrel.mjs')).default;
	global.semanticRelease = api.semanticRelease;
	global.semanticGetConfig = api.semanticGetConfig;
})();

(async () => {
	try {
		await import('../../lib/semrel.mjs')
	} catch (e) {
		// this is fine, semrel is only needed for esm usage
	}
})();

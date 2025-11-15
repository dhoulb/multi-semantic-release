(async () => {
	try {
		await import('../../lib/semrel.mjs')
	} catch (e) {
		// this is fine for cjs flow
	}
})();

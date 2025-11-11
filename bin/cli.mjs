#!/usr/bin/env node

import { createRequire } from "node:module"

(async () => {
	try {
		await import('../lib/index.mjs')
	} catch {
	}
	createRequire(import.meta.url)('./cli.js');
})()

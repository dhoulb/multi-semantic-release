import { createRequire } from 'node:module'
import semanticRelease from 'semantic-release'
import semanticGetConfig from 'semantic-release/lib/get-config.js'

globalThis.__msr__ = {
	semanticRelease,
	semanticGetConfig
};

const require = createRequire(import.meta.url);
const msr = require('./multiSemanticRelease.js');

export default msr

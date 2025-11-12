import { createRequire } from 'node:module'
import './semrel.mjs'

export default createRequire(import.meta.url)('./multiSemanticRelease.js');

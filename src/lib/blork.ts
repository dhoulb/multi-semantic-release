import { existsSync, lstatSync } from 'fs'
import { ValueError, add, check, checker } from 'blork'
import { Writable } from 'stream'
import { WritableStreamBuffer } from 'stream-buffers'

// Get some checkers.
const isAbsolute = checker('absolute')

// Add a directory checker.
add(
  'directory',
  v => isAbsolute(v) && existsSync(v) && lstatSync(v).isDirectory(),
  'directory that exists in the filesystem',
)

// Add a writable stream checker.
add(
  'stream',
  // istanbul ignore next (not important)
  v => v instanceof Writable || v instanceof WritableStreamBuffer,
  'instance of stream.Writable or WritableStreamBuffer',
)

// Exports.
export { checker, check, ValueError }

import { isAbsolute, join, normalize } from 'path'

import { check } from './blork'

/**
 * Normalize and make a path absolute, optionally using a custom CWD.
 * Trims any trailing slashes from the path.
 *
 * @param path The path to normalize and make absolute.
 * @param cwd=process.cwd() The CWD to prepend to the path to make it absolute.
 *
 * @returns The absolute and normalized path.
 *
 * @internal
 */
export default function cleanPath(path: string, cwd = process.cwd()): string {
  // Checks.
  check(path, 'path: path')
  check(cwd, 'cwd: absolute')

  // Normalize, absolutify, and trim trailing slashes from the path.
  return normalize(isAbsolute(path) ? path : join(cwd, path)).replace(
    /[/\\]+$/,
    '',
  )
}

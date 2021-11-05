import semrelPkgJson from 'semantic-release/package.json'

import getPackagePaths from '../lib/getPackagePaths'
import multiSemanticRelease from '../lib/multiSemanticRelease'
import multisemrelPkgJson from '../../package.json'

import debugFactory from 'debug'

export default (flags: Record<string, any>) => {
  if (flags.debug) {
    debugFactory.enable('msr:*')
  }

  // Get directory.
  const cwd = process.cwd()

  // Catch errors.
  try {
    console.log(`multi-semantic-release version: ${multisemrelPkgJson.version}`)
    console.log(`semantic-release version: ${semrelPkgJson.version}`)
    console.log(`flags: ${JSON.stringify(flags, null, 2)}`)

    // Get list of package.json paths according to workspaces.
    const paths = getPackagePaths(cwd, flags.ignorePackages)
    console.log('package paths', paths)

    // Do multirelease (log out any errors).
    multiSemanticRelease(paths, {}, { cwd }, flags).then(
      () => {
        // Success.
        process.exit(0)
      },
      error => {
        // Log out errors.
        console.error(`[multi-semantic-release]:`, error)
        process.exit(1)
      },
    )
  } catch (error) {
    // Log out errors.
    console.error(`[multi-semantic-release]:`, error)
    process.exit(1)
  }
}

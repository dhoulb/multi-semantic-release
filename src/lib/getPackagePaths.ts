import { Packages, getPackagesSync } from '@manypkg/get-packages'
import path from 'path'

import glob from './glob'
import getManifest from './getManifest'

/**
 * Return array of package.json for workspace packages.
 *
 * @param cwd The current working directory where a package.json file can be found.
 * @param ignorePackages (Optional) Packages to be ignored passed via cli.
 * @returns An array of package.json files corresponding to the workspaces setting in package.json
 */
export default function getPackagePaths(
  cwd: string,
  ignorePackages?: string[],
): string[] {
  let workspace: Packages = {
    tool: 'root',
    root: { dir: cwd },
  } as any

  // Ignore exceptions as we will rely on `getManifest` validation
  try {
    workspace = getPackagesSync(cwd)
  } catch (e) {
    /**/
  }

  workspace.root.packageJson = getManifest(
    path.join(workspace.root.dir, 'package.json'),
  )

  if (workspace.tool === 'root') {
    workspace.packages = []
  }

  // remove cwd from results
  const packages = workspace.packages.map(p => path.relative(cwd, p.dir))

  // If packages to be ignored come from CLI, we need to combine them with the ones from manifest workspaces
  if (Array.isArray(ignorePackages)) {
    packages.push(...ignorePackages.map(p => `!${p}`))
  }

  // Turn workspaces into list of package.json files.
  const workspacePackages = glob(
    packages.map((p: string) => p.replace(/\/?$/, '/package.json')),
    {
      cwd: cwd,
      absolute: true,
      gitignore: true,
    },
  )

  // Must have at least one workspace-package.
  if (workspacePackages.length === 0) {
    throw new TypeError(
      'package.json: Project must contain one or more workspace-packages',
    )
  }

  // Return.
  return workspacePackages
}

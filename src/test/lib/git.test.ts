import tempy from 'tempy'
import { WritableStreamBuffer } from 'stream-buffers'

import multiSemanticRelease from '../../lib/multiSemanticRelease'
import { copyDirectory, createNewTestingFiles } from '../helpers/file'
import { gitInit, gitCommitAll, gitInitOrigin, gitPush } from '../helpers/git'
import { getTags } from '../../lib/git'

jest.setTimeout(50000)

test('Fetch all tags on master after two package release', async () => {
  const packages = ['packages/c/', 'packages/d/']

  // Create Git repo with copy of Yarn workspaces fixture.
  const cwd = gitInit('master')
  copyDirectory(`src/test/fixtures/yarnWorkspaces2Packages/`, cwd)
  gitCommitAll(cwd, 'feat: Initial release')
  gitInitOrigin(cwd, 'release')
  gitPush(cwd)

  const stdout = new WritableStreamBuffer() as any
  const stderr = new WritableStreamBuffer() as any

  // Call multiSemanticRelease()
  // Doesn't include plugins that actually publish.
  await multiSemanticRelease(
    packages.map(folder => `${folder}package.json`),
    {
      branches: [{ name: 'master' }, { name: 'release' }],
    },
    { cwd, stdout, stderr },
  )

  const tags = getTags('master', { cwd }).sort()
  expect(tags).toEqual(['msr-test-d@1.0.0', 'msr-test-c@1.0.0'].sort())
})

test('Fetch only prerelease tags', async () => {
  const packages = ['packages/c/', 'packages/d/']

  // Create Git repo with copy of Yarn workspaces fixture.
  const cwd = gitInit('master')
  copyDirectory(`src/test/fixtures/yarnWorkspaces2Packages/`, cwd)
  gitCommitAll(cwd, 'feat: Initial release')
  gitInitOrigin(cwd, 'release')
  gitPush(cwd)

  let stdout = new WritableStreamBuffer() as any
  let stderr = new WritableStreamBuffer() as any

  // Call multiSemanticRelease()
  // Doesn't include plugins that actually publish.
  await multiSemanticRelease(
    packages.map(folder => `${folder}package.json`),
    {
      branches: [{ name: 'master' }, { name: 'release' }],
    },
    { cwd, stdout, stderr },
  )

  // Add new testing files for a new release.
  createNewTestingFiles(packages, cwd)
  gitCommitAll(
    cwd,
    'feat: New prerelease\n\nBREAKING CHANGE: bump to bigger value',
  )
  gitPush(cwd)

  // Capture output.
  stdout = new WritableStreamBuffer()
  stderr = new WritableStreamBuffer()

  // Call multiSemanticRelease() for a second release
  // Doesn't include plugins that actually publish.
  // Change the master branch from release to prerelease to test bumping.
  await multiSemanticRelease(
    packages.map(folder => `${folder}package.json`),
    {
      branches: [{ name: 'master', prerelease: 'beta' }, { name: 'release' }],
    },
    { cwd, stdout, stderr },
  )

  const tags = getTags('master', { cwd }, ['beta']).sort()
  expect(tags).toEqual(
    ['msr-test-d@2.0.0-beta.1', 'msr-test-c@2.0.0-beta.1'].sort(),
  )
})

test('Throws error if obtaining the tags fails', () => {
  const cwd = tempy.directory()

  const t = () => {
    getTags('master', { cwd })
  }
  expect(t).toThrow(Error)
})

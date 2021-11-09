/* eslint-disable @typescript-eslint/no-var-requires */
import { writeFileSync } from 'fs'
import { WritableStreamBuffer } from 'stream-buffers'

import multiSemanticRelease from '../../lib/multiSemanticRelease'
import { copyDirectory, createNewTestingFiles } from '../helpers/file'
import {
  gitInit,
  gitAdd,
  gitCommit,
  gitCommitAll,
  gitInitOrigin,
  gitPush,
  gitTag,
} from '../helpers/git'

// Clear mocks before tests.
beforeEach(() => {
  jest.clearAllMocks() // Clear all mocks.
  require.cache = {} // Clear the require cache so modules are loaded fresh.
})

// Tests.
describe('multiSemanticRelease()', () => {
  test('Initial commit (changes in all packages)', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    const sha = gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    const result: any = await multiSemanticRelease(
      [
        `packages/a/package.json`,
        `packages/b/package.json`,
        `packages/c/package.json`,
        `packages/d/package.json`,
      ],
      {},
      { cwd, stdout, stderr },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Loaded package msr-test-a')
    expect(out).toMatch('Loaded package msr-test-b')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 4 packages! Starting release...')
    expect(out).toMatch('Created tag msr-test-a@1.0.0')
    expect(out).toMatch('Created tag msr-test-b@1.0.0')
    expect(out).toMatch('Created tag msr-test-c@1.0.0')
    expect(out).toMatch('Created tag msr-test-d@1.0.0')
    expect(out).toMatch('Released 4 of 4 packages, semantically!')

    // A.
    expect(result[0].name).toBe('msr-test-a')
    expect(result[0].result.lastRelease).toEqual({})
    expect(result[0].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-a@1.0.0',
      type: 'minor',
      version: '1.0.0',
    })
    expect(result[0].result.nextRelease.notes).toMatch('# msr-test-a 1.0.0')
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0',
    )

    // B.
    expect(result[1].name).toBe('msr-test-b')
    expect(result[1].result.lastRelease).toEqual({})
    expect(result[1].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-b@1.0.0',
      type: 'minor',
      version: '1.0.0',
    })
    expect(result[1].result.nextRelease.notes).toMatch('# msr-test-b 1.0.0')
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0\n* **msr-test-c:** upgraded to 1.0.0',
    )

    // C.
    expect(result[2].name).toBe('msr-test-c')
    expect(result[2].result.lastRelease).toEqual({})
    expect(result[2].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-c@1.0.0',
      type: 'minor',
      version: '1.0.0',
    })
    expect(result[2].result.nextRelease.notes).toMatch('# msr-test-c 1.0.0')
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-d:** upgraded to 1.0.0',
    )

    // D.
    expect(result[3].name).toBe('msr-test-d')
    expect(result[3].result.lastRelease).toEqual({})
    expect(result[3].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-d@1.0.0',
      type: 'minor',
      version: '1.0.0',
    })
    expect(result[3].result.nextRelease.notes).toMatch('# msr-test-d 1.0.0')
    expect(result[3].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[3].result.nextRelease.notes).not.toMatch('### Dependencies')

    // ONLY four times.
    expect(result).toHaveLength(4)

    // Check manifests.
    expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
      peerDependencies: {
        'msr-test-c': '1.0.0',
      },
    })
    expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
      dependencies: {
        'msr-test-a': '1.0.0',
      },
      devDependencies: {
        'msr-test-c': '1.0.0',
      },
    })
    expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
      devDependencies: {
        'msr-test-d': '1.0.0',
      },
    })
  })

  test('Initial commit (changes in all packages with prereleases)', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit('master')
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    const sha = gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd, 'release')
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    const result: any = await multiSemanticRelease(
      [
        `packages/a/package.json`,
        `packages/b/package.json`,
        `packages/c/package.json`,
        `packages/d/package.json`,
      ],
      {
        branches: [{ name: 'master', prerelease: 'dev' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Loaded package msr-test-a')
    expect(out).toMatch('Loaded package msr-test-b')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 4 packages! Starting release...')
    expect(out).toMatch('Created tag msr-test-a@1.0.0-dev.1')
    expect(out).toMatch('Created tag msr-test-b@1.0.0-dev.1')
    expect(out).toMatch('Created tag msr-test-c@1.0.0-dev.1')
    expect(out).toMatch('Created tag msr-test-d@1.0.0-dev.1')
    expect(out).toMatch('Released 4 of 4 packages, semantically!')

    // A.
    expect(result[0].name).toBe('msr-test-a')
    expect(result[0].result.lastRelease).toEqual({})
    expect(result[0].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-a@1.0.0-dev.1',
      type: 'minor',
      version: '1.0.0-dev.1',
    })
    expect(result[0].result.nextRelease.notes).toMatch(
      '# msr-test-a 1.0.0-dev.1',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0-dev.1',
    )

    // B.
    expect(result[1].name).toBe('msr-test-b')
    expect(result[1].result.lastRelease).toEqual({})
    expect(result[1].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-b@1.0.0-dev.1',
      type: 'minor',
      version: '1.0.0-dev.1',
    })
    expect(result[1].result.nextRelease.notes).toMatch(
      '# msr-test-b 1.0.0-dev.1',
    )
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0-dev.1\n* **msr-test-c:** upgraded to 1.0.0-dev.1',
    )

    // C.
    expect(result[2].name).toBe('msr-test-c')
    expect(result[2].result.lastRelease).toEqual({})
    expect(result[2].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-c@1.0.0-dev.1',
      type: 'minor',
      version: '1.0.0-dev.1',
    })
    expect(result[2].result.nextRelease.notes).toMatch(
      '# msr-test-c 1.0.0-dev.1',
    )
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-d:** upgraded to 1.0.0-dev.1',
    )

    // D.
    expect(result[3].name).toBe('msr-test-d')
    expect(result[3].result.lastRelease).toEqual({})
    expect(result[3].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-d@1.0.0-dev.1',
      type: 'minor',
      version: '1.0.0-dev.1',
    })
    expect(result[3].result.nextRelease.notes).toMatch(
      '# msr-test-d 1.0.0-dev.1',
    )
    expect(result[3].result.nextRelease.notes).toMatch(
      '### Features\n\n* Initial release',
    )
    expect(result[3].result.nextRelease.notes).not.toMatch('### Dependencies')

    // ONLY four times.
    expect(result).toHaveLength(4)

    // Check manifests.
    expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
      peerDependencies: {
        'msr-test-c': '1.0.0-dev.1',
      },
    })
    expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
      dependencies: {
        'msr-test-a': '1.0.0-dev.1',
      },
      devDependencies: {
        'msr-test-c': '1.0.0-dev.1',
      },
    })
    expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
      devDependencies: {
        'msr-test-d': '1.0.0-dev.1',
      },
    })
  })
  test('Two separate releases (changes in only one package in second release with prereleases)', async () => {
    const packages = ['packages/c/', 'packages/d/']

    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit('master')
    copyDirectory(`src/test/fixtures/yarnWorkspaces2Packages/`, cwd)
    const sha1 = gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd, 'release')
    gitPush(cwd)

    let stdout = new WritableStreamBuffer() as any
    let stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    let result: any = await multiSemanticRelease(
      packages.map(folder => `${folder}package.json`),
      {
        branches: [{ name: 'master', prerelease: 'dev' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Add new testing files for a new release.
    createNewTestingFiles(['packages/c/'], cwd)
    const sha = gitCommitAll(cwd, 'feat: New release on package c only')
    gitPush(cwd)

    // Capture output.
    stdout = new WritableStreamBuffer() as any
    stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease() for a second release
    // Doesn't include plugins that actually publish.
    result = await multiSemanticRelease(
      packages.map(folder => `${folder}package.json`),
      {
        branches: [{ name: 'master', prerelease: 'dev' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 2 packages...')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 2 packages! Starting release...')
    expect(out).toMatch('Created tag msr-test-c@1.0.0-dev.2')
    expect(out).toMatch('Released 1 of 2 packages, semantically!')

    // D.
    expect(result[0].name).toBe('msr-test-c')
    expect(result[0].result.lastRelease).toEqual({
      channels: ['master'],
      gitHead: sha1,
      gitTag: 'msr-test-c@1.0.0-dev.1',
      name: 'msr-test-c@1.0.0-dev.1',
      version: '1.0.0-dev.1',
    })
    expect(result[0].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-c@1.0.0-dev.2',
      type: 'minor',
      version: '1.0.0-dev.2',
    })

    expect(result[0].result.nextRelease.notes).toMatch(
      '# msr-test-c [1.0.0-dev.2]',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Features\n\n* New release on package c only',
    )
    expect(result[0].result.nextRelease.notes).not.toMatch('### Dependencies')

    // ONLY 1 time.
    expect(result).toHaveLength(2)

    // Check manifests.
    expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
      dependencies: {
        'msr-test-d': '1.0.0-dev.1',
      },
    })
  })
  test('Two separate releases (release to prerelease)', async () => {
    const packages = ['packages/c/', 'packages/d/']

    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit('master')
    copyDirectory(`src/test/fixtures/yarnWorkspaces2Packages/`, cwd)
    const sha1 = gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd, 'release')
    gitPush(cwd)

    let stdout = new WritableStreamBuffer() as any
    let stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    let result: any = await multiSemanticRelease(
      packages.map(folder => `${folder}package.json`),
      {
        branches: [{ name: 'master' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Add new testing files for a new release.
    createNewTestingFiles(packages, cwd)
    const sha = gitCommitAll(
      cwd,
      'feat: New prerelease\n\nBREAKING CHANGE: bump to bigger value',
    )
    gitPush(cwd)

    // Capture output.
    stdout = new WritableStreamBuffer() as any
    stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease() for a second release
    // Doesn't include plugins that actually publish.
    // Change the master branch from release to prerelease to test bumping.
    result = await multiSemanticRelease(
      packages.map(folder => `${folder}package.json`),
      {
        branches: [{ name: 'master', prerelease: 'beta' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 2 packages...')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 2 packages! Starting release...')
    expect(out).toMatch('Created tag msr-test-c@2.0.0-beta.1')
    expect(out).toMatch('Created tag msr-test-d@2.0.0-beta.1')
    expect(out).toMatch('Released 2 of 2 packages, semantically!')

    // D.
    expect(result[0].name).toBe('msr-test-c')
    expect(result[0].result.lastRelease).toEqual({
      channels: [null],
      gitHead: sha1,
      gitTag: 'msr-test-c@1.0.0',
      name: 'msr-test-c@1.0.0',
      version: '1.0.0',
    })
    expect(result[0].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-c@2.0.0-beta.1',
      type: 'major',
      version: '2.0.0-beta.1',
    })

    expect(result[0].result.nextRelease.notes).toMatch(
      '# msr-test-c [2.0.0-beta.1]',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Features\n\n* New prerelease',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-d:** upgraded to 2.0.0-beta.1',
    )

    expect(result[1].result.nextRelease.notes).toMatch(
      '# msr-test-d [2.0.0-beta.1]',
    )
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Features\n\n* New prerelease',
    )
    expect(result[1].result.nextRelease.notes).not.toMatch('### Dependencies')

    // ONLY 1 time.
    expect(result).toHaveLength(2)

    // Check manifests.
    expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
      dependencies: {
        'msr-test-d': '2.0.0-beta.1',
      },
    })
  }, 30000)

  test('Two separate releases (changes in all packages with prereleases)', async () => {
    const packages = [
      'packages/a/',
      'packages/b/',
      'packages/c/',
      'packages/d/',
    ]

    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit('master')
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    const sha1 = gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd, 'release')
    gitPush(cwd)

    let stdout = new WritableStreamBuffer() as any
    let stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    let result: any = await multiSemanticRelease(
      packages.map(folder => `${folder}package.json`),
      {
        branches: [{ name: 'master', prerelease: 'dev' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Add new testing files for a new release.
    createNewTestingFiles(packages, cwd)
    const sha = gitCommitAll(cwd, 'feat: New releases')
    gitPush(cwd)

    // Capture output.
    stdout = new WritableStreamBuffer() as any
    stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease() for a second release
    // Doesn't include plugins that actually publish.
    result = await multiSemanticRelease(
      packages.map(folder => `${folder}package.json`),
      {
        branches: [{ name: 'master', prerelease: 'dev' }, { name: 'release' }],
      },
      { cwd, stdout, stderr },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Loaded package msr-test-a')
    expect(out).toMatch('Loaded package msr-test-b')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 4 packages! Starting release...')
    expect(out).toMatch('Created tag msr-test-a@1.0.0-dev.2')
    expect(out).toMatch('Created tag msr-test-b@1.0.0-dev.2')
    expect(out).toMatch('Created tag msr-test-c@1.0.0-dev.2')
    expect(out).toMatch('Created tag msr-test-d@1.0.0-dev.2')
    expect(out).toMatch('Released 4 of 4 packages, semantically!')

    // A.
    expect(result[0].name).toBe('msr-test-a')
    expect(result[0].result.lastRelease).toEqual({
      channels: ['master'],
      gitHead: sha1,
      gitTag: 'msr-test-a@1.0.0-dev.1',
      name: 'msr-test-a@1.0.0-dev.1',
      version: '1.0.0-dev.1',
    })
    expect(result[0].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-a@1.0.0-dev.2',
      type: 'minor',
      version: '1.0.0-dev.2',
    })
    expect(result[0].result.nextRelease.notes).toMatch(
      '# msr-test-a [1.0.0-dev.2]',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Features\n\n* New releases',
    )
    expect(result[0].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-c:** upgraded to 1.0.0-dev.2',
    )

    // B.
    expect(result[1].name).toBe('msr-test-b')
    expect(result[1].result.lastRelease).toEqual({
      channels: ['master'],
      gitHead: sha1,
      gitTag: 'msr-test-b@1.0.0-dev.1',
      name: 'msr-test-b@1.0.0-dev.1',
      version: '1.0.0-dev.1',
    })
    expect(result[1].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-b@1.0.0-dev.2',
      type: 'minor',
      version: '1.0.0-dev.2',
    })
    expect(result[1].result.nextRelease.notes).toMatch(
      '# msr-test-b [1.0.0-dev.2]',
    )
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Features\n\n* New releases',
    )
    expect(result[1].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-a:** upgraded to 1.0.0-dev.2\n* **msr-test-c:** upgraded to 1.0.0-dev.2',
    )

    // C.
    expect(result[2].name).toBe('msr-test-c')
    expect(result[2].result.lastRelease).toEqual({
      channels: ['master'],
      gitHead: sha1,
      gitTag: 'msr-test-c@1.0.0-dev.1',
      name: 'msr-test-c@1.0.0-dev.1',
      version: '1.0.0-dev.1',
    })
    expect(result[2].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-c@1.0.0-dev.2',
      type: 'minor',
      version: '1.0.0-dev.2',
    })
    expect(result[2].result.nextRelease.notes).toMatch(
      '# msr-test-c [1.0.0-dev.2]',
    )
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Features\n\n* New releases',
    )
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-d:** upgraded to 1.0.0-dev.2',
    )

    // D.
    expect(result[3].name).toBe('msr-test-d')
    expect(result[3].result.lastRelease).toEqual({
      channels: ['master'],
      gitHead: sha1,
      gitTag: 'msr-test-d@1.0.0-dev.1',
      name: 'msr-test-d@1.0.0-dev.1',
      version: '1.0.0-dev.1',
    })
    expect(result[3].result.nextRelease).toMatchObject({
      gitHead: sha,
      gitTag: 'msr-test-d@1.0.0-dev.2',
      type: 'minor',
      version: '1.0.0-dev.2',
    })
    expect(result[3].result.nextRelease.notes).toMatch(
      '# msr-test-d [1.0.0-dev.2]',
    )
    expect(result[3].result.nextRelease.notes).toMatch(
      '### Features\n\n* New releases',
    )
    expect(result[3].result.nextRelease.notes).not.toMatch('### Dependencies')

    // ONLY four times.
    expect(result).toHaveLength(4)

    // Check manifests.
    expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
      peerDependencies: {
        'msr-test-c': '1.0.0-dev.2',
      },
    })
    expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
      dependencies: {
        'msr-test-a': '1.0.0-dev.2',
      },
      devDependencies: {
        'msr-test-c': '1.0.0-dev.2',
      },
    })
    expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
      devDependencies: {
        'msr-test-d': '1.0.0-dev.2',
      },
    })
  }, 30000)
  test('No changes in any packages', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    // Creating the four tags so there are no changes in any packages.
    gitTag(cwd, 'msr-test-a@1.0.0')
    gitTag(cwd, 'msr-test-b@1.0.0')
    gitTag(cwd, 'msr-test-c@1.0.0')
    gitTag(cwd, 'msr-test-d@1.0.0')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    const result: any = await multiSemanticRelease(
      [
        `packages/c/package.json`,
        `packages/a/package.json`,
        `packages/d/package.json`,
        `packages/b/package.json`,
      ],
      {},
      { cwd, stdout, stderr },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Loaded package msr-test-a')
    expect(out).toMatch('Loaded package msr-test-b')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 4 packages! Starting release...')
    expect(out).toMatch(
      'There are no relevant changes, so no new version is released',
    )
    expect(out).not.toMatch('Created tag')
    expect(out).toMatch('Released 0 of 4 packages, semantically!')

    // Results.
    expect(result[0].result).toBe(false)
    expect(result[1].result).toBe(false)
    expect(result[2].result).toBe(false)
    expect(result[3].result).toBe(false)
    expect(result).toHaveLength(4)
  })
  test('Changes in some packages', async () => {
    // Create Git repo.
    const cwd = gitInit()
    // Initial commit.
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    const sha1 = gitCommitAll(cwd, 'feat: Initial release')
    gitTag(cwd, 'msr-test-a@1.0.0')
    gitTag(cwd, 'msr-test-b@1.0.0')
    gitTag(cwd, 'msr-test-c@1.0.0')
    gitTag(cwd, 'msr-test-d@1.0.0')
    // Second commit.
    writeFileSync(`${cwd}/packages/a/aaa.txt`, 'AAA')
    const sha2 = gitCommitAll(cwd, 'feat(aaa): Add missing text file')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    const result: any = await multiSemanticRelease(
      [
        `packages/c/package.json`,
        `packages/d/package.json`,
        `packages/b/package.json`,
        `packages/a/package.json`,
      ],
      {},
      { cwd, stdout, stderr },
      { deps: {}, dryRun: false },
    )

    // Get stdout and stderr output.
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)
    const out = stdout.getContentsAsString('utf8')
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Loaded package msr-test-a')
    expect(out).toMatch('Loaded package msr-test-b')
    expect(out).toMatch('Loaded package msr-test-c')
    expect(out).toMatch('Loaded package msr-test-d')
    expect(out).toMatch('Queued 4 packages! Starting release...')
    expect(out).toMatch('Created tag msr-test-a@1.1.0')
    expect(out).toMatch('Created tag msr-test-b@1.0.1')
    expect(out).toMatch(
      'There are no relevant changes, so no new version is released',
    )
    expect(out).toMatch('Released 2 of 4 packages, semantically!')

    // A.
    expect(result[3].name).toBe('msr-test-a')
    expect(result[3].result.lastRelease).toMatchObject({
      gitHead: sha1,
      gitTag: 'msr-test-a@1.0.0',
      version: '1.0.0',
    })
    expect(result[3].result.nextRelease).toMatchObject({
      gitHead: sha2,
      gitTag: 'msr-test-a@1.1.0',
      type: 'minor',
      version: '1.1.0',
    })
    expect(result[3].result.nextRelease.notes).toMatch('# msr-test-a [1.1.0]')
    expect(result[3].result.nextRelease.notes).toMatch(
      '### Features\n\n* **aaa:** Add missing text file',
    )

    // B.
    expect(result[2].name).toBe('msr-test-b')
    expect(result[2].result.lastRelease).toEqual({
      channels: [null],
      gitHead: sha1,
      gitTag: 'msr-test-b@1.0.0',
      name: 'msr-test-b@1.0.0',
      version: '1.0.0',
    })
    expect(result[2].result.nextRelease).toMatchObject({
      gitHead: sha2,
      gitTag: 'msr-test-b@1.0.1',
      type: 'patch',
      version: '1.0.1',
    })
    expect(result[2].result.nextRelease.notes).toMatch('# msr-test-b [1.0.1]')
    expect(result[2].result.nextRelease.notes).not.toMatch('### Features')
    expect(result[2].result.nextRelease.notes).not.toMatch('### Bug Fixes')
    expect(result[2].result.nextRelease.notes).toMatch(
      '### Dependencies\n\n* **msr-test-a:** upgraded to 1.1.0',
    )

    // C.
    expect(result[0].name).toBe('msr-test-c')
    expect(result[0].result).toBe(false)

    // D.
    expect(result[1].name).toBe('msr-test-d')
    expect(result[1].result).toBe(false)

    // ONLY four times.
    expect(result[4]).toBeUndefined()

    // Check manifests.
    expect(require(`${cwd}/packages/a/package.json`)).toMatchObject({
      peerDependencies: {
        'msr-test-c': '1.0.0',
      },
    })
    expect(require(`${cwd}/packages/b/package.json`)).toMatchObject({
      dependencies: {
        'msr-test-a': '1.1.0',
      },
      devDependencies: {
        'msr-test-c': '1.0.0',
      },
    })
    expect(require(`${cwd}/packages/c/package.json`)).toMatchObject({
      devDependencies: {
        'msr-test-d': '*',
      },
    })
  })

  test("Error if release's local deps have no version number", async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitAdd(cwd, 'packages/a/package.json')
    gitCommit(cwd, 'feat: Commit first package only')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    await expect(
      multiSemanticRelease(
        [`packages/a/package.json`, `packages/c/package.json`],
        {},
        { cwd, stdout, stderr },
      ),
    ).rejects.toMatchObject({
      message:
        'Cannot release because dependency msr-test-c has not been released',
    })
  })
  test('Configured plugins are called as normal', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Make an inline plugin.
    const plugin: any = {
      verifyConditions: jest.fn(),
      analyzeCommits: jest.fn(),
      verifyRelease: jest.fn(),
      generateNotes: jest.fn(),
      prepare: jest.fn(),
      success: jest.fn(),
      fail: jest.fn(),
    }

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    await multiSemanticRelease(
      [`packages/d/package.json`],
      {
        // Override to add our own plugins.
        plugins: ['@semantic-release/release-notes-generator', plugin],
        analyzeCommits: ['@semantic-release/commit-analyzer'],
      },
      { cwd, stdout, stderr },
    )

    // Check calls.
    expect(plugin.verifyConditions).toHaveBeenCalledTimes(1)
    expect(plugin.analyzeCommits).toHaveBeenCalledTimes(0) // NOTE overridden
    expect(plugin.verifyRelease).toHaveBeenCalledTimes(1)
    expect(plugin.generateNotes).toHaveBeenCalledTimes(1)
    expect(plugin.prepare).toHaveBeenCalledTimes(1)
    expect(plugin.success).toHaveBeenCalledTimes(1)
    expect(plugin.fail).not.toHaveBeenCalled()
  })
  test('Package-specific configuration overrides global configuration', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/packageOptions/`, cwd)
    // Create a docs commit that should be a patch release with package B's config
    gitCommitAll(cwd, 'docs: testing')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Call multiSemanticRelease()
    const [aResult, bResult]: any[] = await multiSemanticRelease(
      [`packages/a/package.json`, `packages/b/package.json`],
      {},
      { cwd, stdout, stderr },
    )

    // Check no stderr
    const err = stderr.getContentsAsString('utf8')
    expect(err).toBe(false)

    // A: no releases
    expect(aResult.result).toBe(false)

    // B: patch release
    expect(bResult.result.nextRelease.type).toBe('patch')
  })
  test('Deep errors (e.g. in plugins) bubble up and out', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Capture output.
    const stdout = new WritableStreamBuffer() as any
    const stderr = new WritableStreamBuffer() as any

    // Release.

    // Call multiSemanticRelease()
    // Doesn't include plugins that actually publish.
    await expect(
      multiSemanticRelease(
        [`packages/d/package.json`, `packages/a/package.json`],
        {
          // Override to add our own erroring plugin.
          plugins: [
            {
              analyzeCommits: () => {
                throw new Error('NOPE')
              },
            },
          ] as any,
        },
        { cwd, stdout, stderr },
      ),
    ).rejects.toMatchObject({ message: 'NOPE' })
  })

  test('ReferenceError if paths points to a non-file', async () => {
    const stdout = new WritableStreamBuffer() as any // Blackhole the output so it doesn't clutter Jest.
    const r1 = multiSemanticRelease(
      ['src/test/fixtures/DOESNOTEXIST.json'],
      {},
      { stdout },
    )
    await expect(r1).rejects.toBeInstanceOf(ReferenceError) // Path that does not exist.
    const r2 = multiSemanticRelease(
      ['src/test/fixtures/DOESNOTEXIST/'],
      {},
      { stdout },
    )
    await expect(r2).rejects.toBeInstanceOf(ReferenceError) // Path that does not exist.
    const r3 = multiSemanticRelease(['src/test/fixtures/'], {}, { stdout })
    await expect(r3).rejects.toBeInstanceOf(ReferenceError) // Directory that exists.
  })
  test('SyntaxError if paths points to package.json with bad syntax', async () => {
    const stdout = new WritableStreamBuffer() as any // Blackhole the output so it doesn't clutter Jest.
    const r1 = multiSemanticRelease(
      ['src/test/fixtures/invalidPackage.json'],
      {},
      { stdout },
    )
    await expect(r1).rejects.toBeInstanceOf(SyntaxError)
    await expect(r1).rejects.toMatchObject({
      message: expect.stringMatching('could not be parsed'),
    })
    const r2 = multiSemanticRelease(
      ['src/test/fixtures/numberPackage.json'],
      {},
      { stdout },
    )
    await expect(r2).rejects.toBeInstanceOf(SyntaxError)
    await expect(r2).rejects.toMatchObject({
      message: expect.stringMatching('not an object'),
    })
    const r3 = multiSemanticRelease(
      ['src/test/fixtures/badNamePackage.json'],
      {},
      { stdout },
    )
    await expect(r3).rejects.toBeInstanceOf(SyntaxError)
    await expect(r3).rejects.toMatchObject({
      message: expect.stringMatching('Package name must be non-empty string'),
    })
    const r4 = multiSemanticRelease(
      ['src/test/fixtures/badDepsPackage.json'],
      {},
      { stdout },
    )
    await expect(r4).rejects.toBeInstanceOf(SyntaxError)
    await expect(r4).rejects.toMatchObject({
      message: expect.stringMatching('Package dependencies must be object'),
    })
    const r5 = multiSemanticRelease(
      ['src/test/fixtures/badDevDepsPackage.json'],
      {},
      { stdout },
    )
    await expect(r5).rejects.toBeInstanceOf(SyntaxError)
    await expect(r5).rejects.toMatchObject({
      message: expect.stringMatching('Package devDependencies must be object'),
    })
    const r6 = multiSemanticRelease(
      ['src/test/fixtures/badPeerDepsPackage.json'],
      {},
      { stdout },
    )
    await expect(r6).rejects.toBeInstanceOf(SyntaxError)
    await expect(r6).rejects.toMatchObject({
      message: expect.stringMatching('Package peerDependencies must be object'),
    })
  })
})

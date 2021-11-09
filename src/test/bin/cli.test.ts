import execa from 'execa'
import * as path from 'path'

import { copyDirectory } from '../helpers/file'
import { gitInit, gitCommitAll, gitInitOrigin, gitPush } from '../helpers/git'

// Tests are a bit long, let's increase the Jest timeout
jest.setTimeout(5 * 60 * 1000)

// Tests.
describe('multi-semantic-release CLI', () => {
  test('Initial commit (changes in all packages)', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Path to CLI command.
    const filepath = path.resolve(__dirname, `../../bin/cli.ts`)

    // Run via command line.
    const out = (await execa('ts-node', ['--files', filepath], { cwd })).stdout
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Released 4 of 4 packages, semantically!')
  })

  test('Initial commit (changes in 2 packages, 2 filtered out)', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Path to CLI command.
    const filepath = path.resolve(__dirname, `../../bin/cli.ts`)

    // Run via command line.
    const out = (
      await execa(
        'ts-node',
        ['--files', filepath, '--ignore-packages=packages/c/**,packages/d/**'],
        { cwd },
      )
    ).stdout
    expect(out).toMatch('Started multirelease! Loading 2 packages...')
    expect(out).toMatch('Released 2 of 2 packages, semantically!')
  })
})

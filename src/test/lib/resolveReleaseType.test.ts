import { resolveReleaseType } from '../../lib/updateDeps'
import { Package } from '../../typings'

// Tests.
describe('resolveReleaseType()', () => {
  test('Works correctly with no deps', () => {
    expect(
      resolveReleaseType({ localDeps: [] } as any as Package),
    ).toBeUndefined()
  })
  test('Works correctly with deps', () => {
    const pkg1: Package = { _nextType: 'patch', localDeps: [] } as any
    expect(resolveReleaseType(pkg1)).toBe('patch')

    const pkg2: Package = { _nextType: undefined, localDeps: [] } as any
    expect(resolveReleaseType(pkg2)).toBeUndefined()

    const pkg3: Package = {
      _nextType: undefined,
      localDeps: [
        { _nextType: false, localDeps: [] },
        { _nextType: false, localDeps: [] },
      ],
    } as any
    expect(resolveReleaseType(pkg3)).toBeUndefined()

    const pkg4: Package = {
      manifest: { dependencies: { a: '1.0.0' } },
      _nextType: undefined,
      localDeps: [
        {
          name: 'a',
          _nextType: 'patch',
          localDeps: [],
          _lastRelease: { version: '1.0.0' },
        },
        {
          name: 'b',
          _nextType: false,
          localDeps: [],
          _lastRelease: { version: '1.0.0' },
        },
      ],
    } as any
    expect(resolveReleaseType(pkg4)).toBe('patch')

    const pkg5: Package = {
      _nextType: undefined,
      localDeps: [
        {
          _nextType: false,
          localDeps: [
            { _nextType: false, localDeps: [] },
            { _nextType: false, localDeps: [] },
          ],
        },
      ],
    } as any
    expect(resolveReleaseType(pkg5)).toBeUndefined()

    const pkg6: Package = {
      manifest: { dependencies: { a: '1.0.0' } },
      _nextType: undefined,
      localDeps: [
        {
          name: 'a',
          _lastRelease: { version: '1.0.0' },
          _nextType: false,
          manifest: { dependencies: { b: '1.0.0', c: '1.0.0', d: '1.0.0' } },
          localDeps: [
            {
              name: 'b',
              _nextType: false,
              localDeps: [],
              _lastRelease: { version: '1.0.0' },
            },
            {
              name: 'c',
              _nextType: 'patch',
              localDeps: [],
              _lastRelease: { version: '1.0.0' },
            },
            {
              name: 'd',
              _nextType: 'major',
              localDeps: [],
              _lastRelease: { version: '1.0.0' },
            },
          ],
        },
      ],
    } as any
    expect(resolveReleaseType(pkg6, 'override', 'inherit')).toBe('major')
  })

  test('No infinite loops', () => {
    const pkg1: Package = { _nextType: 'patch', localDeps: [] } as any
    pkg1.localDeps.push(pkg1)
    expect(resolveReleaseType(pkg1)).toBe('patch')

    const pkg2: Package = { _nextType: undefined, localDeps: [] } as any
    pkg2.localDeps.push(pkg2)
    expect(resolveReleaseType(pkg2)).toBeUndefined()

    const pkg3: Package = {
      _nextType: undefined,
      localDeps: [
        { _nextType: false, localDeps: [] },
        { _nextType: false, localDeps: [] },
      ],
    } as any
    pkg3.localDeps[0].localDeps.push(pkg3.localDeps[0])
    expect(resolveReleaseType(pkg3)).toBeUndefined()

    const pkg4: Package = {
      manifest: { dependencies: { a: '1.0.0', b: '1.0.0' } },
      _nextType: undefined,
      localDeps: [
        {
          name: 'a',
          _nextType: 'patch',
          localDeps: [],
          _lastRelease: { version: '1.0.0' },
        },
        {
          name: 'b',
          _nextType: 'major',
          localDeps: [],
          _lastRelease: { version: '1.0.0' },
        },
      ],
    } as any
    pkg4.localDeps[0].localDeps.push(pkg4.localDeps[0])
    expect(resolveReleaseType(pkg4)).toBe('patch')
  })
})

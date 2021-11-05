import {
  getHighestVersion,
  getLowestVersion,
  getLatestVersion,
  tagsToVersions,
} from '../../lib/utils'

describe('tagsToVersions()', () => {
  // prettier-ignore
  const cases = [
        [[{version: "1.0.0"}, {version: "1.1.0"}, {version: "1.2.0"}], ["1.0.0", "1.1.0", "1.2.0"]],
        [[],[]],
        [undefined, []],
        [null, []],
	]

  cases.forEach(([tags, versions]) => {
    it(`${String(tags)} gives versions as ${String(versions)}`, () => {
      expect(tagsToVersions(tags as any)).toStrictEqual(versions)
    })
  })
})

describe('getHighestVersion()', () => {
  // prettier-ignore
  const cases = [
		["1.0.0", "2.0.0", "2.0.0"],
        ["1.1.1", "1.0.0", "1.1.1"],
        [null, "1.0.0", "1.0.0"],
        ["1.0.0", undefined, "1.0.0"],
        [undefined, undefined, undefined],
	]

  cases.forEach(([version1, version2, high]: any[]) => {
    it(`${String(version1)}/${String(version2)} gives highest as ${String(
      high,
    )}`, () => {
      expect(getHighestVersion(version1, version2)).toBe(high)
    })
  })
})

describe('getLowestVersion()', () => {
  // prettier-ignore
  const cases = [
		["1.0.0", "2.0.0", "1.0.0"],
        ["1.1.1", "1.0.0", "1.0.0"],
        [null, "1.0.0", "1.0.0"],
        ["1.0.0", undefined, "1.0.0"],
        [undefined, undefined, undefined],
	]

  cases.forEach(([version1, version2, low]: any[]) => {
    it(`${String(version1)}/${String(version2)} gives lowest as ${String(
      low,
    )}`, () => {
      expect(getLowestVersion(version1, version2)).toBe(low)
    })
  })
})

describe('getLatestVersion()', () => {
  // prettier-ignore
  const cases = [
		[["1.2.3-alpha.3", "1.2.0", "1.0.1", "1.0.0-alpha.1"], null, "1.2.0"],
        [["1.2.3-alpha.3", "1.2.3-alpha.2"], null, undefined],
        [["1.2.3-alpha.3", "1.2.0", "1.0.1", "1.0.0-alpha.1"], true, "1.2.3-alpha.3"],
        [["1.2.3-alpha.3", "1.2.3-alpha.2"], true, "1.2.3-alpha.3"],
        [[], {}, undefined]
	]

  cases.forEach(([versions, withPrerelease, latest]: any[]) => {
    it(`${String(versions)}/${String(withPrerelease)} gives latest as ${String(
      latest,
    )}`, () => {
      expect(getLatestVersion(versions, withPrerelease)).toBe(latest)
    })
  })
})

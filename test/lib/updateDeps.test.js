const {
	resolveReleaseType,
	resolveNextVersion,
	getNextVersion,
	getNextPreVersion,
	getPreReleaseTag,
	getVersionFromTag,
	updateManifestDeps,
} = require("../../lib/updateDeps");

describe("resolveNextVersion()", () => {
	// prettier-ignore
	const cases = [
		["1.0.0", "1.0.1", undefined, "1.0.1"],
		["1.0.0", "1.0.1", "override", "1.0.1"],

		["*", "1.3.0", "satisfy", "*"],
		["^1.0.0", "1.0.1", "satisfy", "^1.0.0"],
		["^1.2.0", "1.3.0", "satisfy", "^1.2.0"],
		["1.2.x", "1.2.2", "satisfy", "1.2.x"],

		["~1.0.0", "1.1.0", "inherit", "~1.1.0"],
		["1.2.x", "1.2.1", "inherit", "1.2.x"],
		["1.2.x", "1.3.0", "inherit", "1.3.x"],
		["^1.0.0", "2.0.0", "inherit", "^2.0.0"],
		["*", "2.0.0", "inherit", "*"],
		["~1.0", "2.0.0", "inherit", "~2.0"],
		["~2.0", "2.1.0", "inherit", "~2.1"],
    
    ["~1.0.0", "1.1.0", "ignore", "~1.0.0"],
		["1.2.x", "1.2.1", "ignore", "1.2.x"],
		["1.2.x", "1.3.0", "ignore", "1.2.x"],
		["^1.0.0", "2.0.0", "ignore", "^1.0.0"],
		["*", "2.0.0", "ignore", "*"],
		["~1.0", "2.0.0", "ignore", "~1.0"],
		["~2.0", "2.1.0", "ignore", "~2.0"],

		// cases of "workspace protocol" defined in yarn and pnpm
		["workspace:*", "1.0.1", undefined, "1.0.1"],
		["workspace:*", "1.0.1", "override", "1.0.1"],

		["workspace:*", "1.3.0", "satisfy", "1.3.0"],
		["workspace:~", "1.0.1", "satisfy", "~1.0.1"],
		["workspace:^", "1.3.0", "satisfy", "^1.3.0"],
		// the following cases should be treated as if "workspace:" was removed
		["workspace:^1.0.0", "1.0.1", "satisfy", "^1.0.0"],
		["workspace:^1.2.0", "1.3.0", "satisfy", "^1.2.0"],
		["workspace:1.2.x", "1.2.2", "satisfy", "1.2.x"],

		["workspace:*", "1.3.0", "inherit", "1.3.0"],
		["workspace:~", "1.1.0", "inherit", "~1.1.0"],
		["workspace:^", "2.0.0", "inherit", "^2.0.0"],
		// the following cases should be treated as if "workspace:" was removed
		["workspace:~1.0.0", "1.1.0", "inherit", "~1.1.0"],
		["workspace:1.2.x", "1.2.1", "inherit", "1.2.x"],
		["workspace:1.2.x", "1.3.0", "inherit", "1.3.x"],
		["workspace:^1.0.0", "2.0.0", "inherit", "^2.0.0"],
		["workspace:~1.0", "2.0.0", "inherit", "~2.0"],
		["workspace:~2.0", "2.1.0", "inherit", "~2.1"],
    // the following cases should be treated as if "workspace:" was removed with ignore strategy
		["workspace:~1.0.0", "1.1.0", "ignore", "~1.0.0"],
		["workspace:1.2.x", "1.2.1", "ignore", "1.2.x"],
		["workspace:1.2.x", "1.3.0", "ignore", "1.2.x"],
		["workspace:^1.0.0", "2.0.0", "ignore", "^1.0.0"],
		["workspace:~1.0", "2.0.0", "ignore", "~1.0"],
		["workspace:~2.0", "2.1.0", "ignore", "~2.0"],
	]

	cases.forEach(([currentVersion, nextVersion, strategy, resolvedVersion]) => {
		it(`${currentVersion}/${nextVersion}/${strategy} gives ${resolvedVersion}`, () => {
			expect(resolveNextVersion(currentVersion, nextVersion, strategy)).toBe(resolvedVersion);
		});
	});
});

describe("getNextVersion()", () => {
	// prettier-ignore
	const cases = [
		[undefined, "patch", "1.0.0"],
		["1.0.0", "patch", "1.0.1"],
		["2.0.0", undefined, "2.0.0"],
		["1.0.0-dev.1", "major", "1.0.0"],
		["1.0.0-dev.1", undefined, "1.0.0-dev.1"],
		["1.0.0-dev.1", "minor", "1.0.0"],
		["1.0.0-dev.1", "patch", "1.0.0"],
	]

	cases.forEach(([lastVersion, releaseType, nextVersion, preRelease]) => {
		it(`${lastVersion} and ${releaseType} gives ${nextVersion}`, () => {
			// prettier-ignore
			expect(getNextVersion({
				_nextType: releaseType,
				_lastRelease: {version: lastVersion},
				_preRelease: preRelease
			})).toBe(nextVersion);
		});
	});
});

describe("getNextPreVersion()", () => {
	// prettier-ignore
	const cases = [
		[undefined, "patch", "rc", [], "1.0.0-rc.1"],
		[undefined, "patch", "rc", [], "1.0.0-rc.1"],
		[null, "patch", "rc", [], "1.0.0-rc.1"],
		[null, "patch", "rc", [], "1.0.0-rc.1"],
		["1.0.0-rc.0", "minor", "dev", [], "1.0.0-dev.1"],
		["1.0.0-dev.0", "major", "dev", [], "1.0.0-dev.1"],
		["1.0.0-dev.0", "major", "dev", ["1.0.0-dev.1"], "1.0.0-dev.2"],
		["1.0.0-dev.0", "major", "dev", ["1.0.0-dev.1", "1.0.1-dev.0"], "1.0.1-dev.1"],
		["11.0.0", "major", "beta", [], "12.0.0-beta.1"],
		["1.0.0", "minor", "beta", [], "1.1.0-beta.1"],
		["1.0.0", "patch", "beta", [], "1.0.1-beta.1"],
	]

	cases.forEach(([lastVersion, releaseType, preRelease, lastTags, nextVersion]) => {
		it(`${lastVersion} and ${releaseType} ${
			lastTags.length ? "with existent tags " : ""
		}gives ${nextVersion}`, () => {
			// prettier-ignore
			expect(getNextPreVersion(
				{
					_nextType: releaseType,
					_lastRelease: {version: lastVersion},
					_preRelease: preRelease,
					_branch: "master",
				},
				lastTags
			)).toBe(nextVersion);
		});
	});
});

describe("getPreReleaseTag()", () => {
	// prettier-ignore
	const cases = [
		[undefined, null],
		[null, null],
		["1.0.0-rc.0", "rc"],
		["1.0.0-dev.0", "dev"],
		["1.0.0-dev.2", "dev"],
		["1.1.0-beta.0", "beta"],
		["11.0.0", null],
		["11.1.0", null],
		["11.0.1", null],
	]

	cases.forEach(([version, preReleaseTag]) => {
		it(`${version} gives ${preReleaseTag}`, () => {
			// prettier-ignore
			expect(getPreReleaseTag(version)).toBe(preReleaseTag);
		});
	});
});

describe("getVersionFromTag()", () => {
	// prettier-ignore
	const cases = [
		[{}, undefined, null],
		[{ name: undefined }, undefined, null],
		[{}, null, null],
		[{ name: null }, null, null],
		[{ name: undefined }, '1.0.0', '1.0.0'],
		[{ name: null }, '1.0.0', '1.0.0'],
		[{ name: 'abc' }, undefined, null],
		[{ name: 'abc' }, null, null],
		[{ name: 'abc' }, '1.0.0', '1.0.0'],
		[{ name: 'dev' }, '1.0.0-dev.1', '1.0.0-dev.1'],
		[{ name: 'app' }, 'app@1.0.0-dev.1', '1.0.0-dev.1'],
		[{ name: 'app' }, 'app@1.0.0-devapp@.1', null],
		[{ name: 'msr-test-a' }, 'msr-test-a@1.0.0-rc.1', '1.0.0-rc.1'],
		[{ name: 'msr.test.a' }, 'msr.test.a@1.0.0', '1.0.0'],
		[{ name: 'msr_test_a' }, 'msr_test_a@1.0.0', '1.0.0'],
		[{ name: 'msr@test@a' }, 'msr@test@a@1.0.0', '1.0.0'],
		[{ name: 'abc' }, 'a.b.c-rc.0', null],
		[{ name: 'abc' }, '1-rc.0', null],
		[{ name: 'abc' }, '1.0.x-rc.0', null],
		[{ name: 'abc' }, '1.x.0-rc.0', null],
		[{ name: 'abc' }, 'x.1.0-rc.0', null],
	]

	cases.forEach(([pkg, tag, versionFromTag]) => {
		it(`${JSON.stringify(pkg)} pkg with tag ${tag} gives ${versionFromTag}`, () => {
			// prettier-ignore
			expect(getVersionFromTag(pkg, tag)).toBe(versionFromTag);
		});
	});
});

describe("updateManifestDeps()", () => {
	test("updates all changed dependencies to next version", () => {
		const pkg = {
			name: "a",
			_lastRelease: { version: "1.0.0" },
			_nextType: false,
			manifest: { name: "a", dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
			localDeps: [
				{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
				{
					name: "c",
					_nextType: "patch",
					localDeps: [],
					_lastRelease: { version: "1.0.0" },
					_nextRelease: { version: "1.0.1" },
				},
				{
					name: "d",
					_nextType: "major",
					localDeps: [],
					_lastRelease: { version: "1.0.0" },
					_nextRelease: { version: "2.0.0" },
				},
			],
		};
		pkg._depsChanged = [pkg.localDeps[1], pkg.localDeps[2]];

		updateManifestDeps(pkg, false);
		expect(pkg.manifest).toMatchObject({ name: "a", dependencies: { b: "1.0.0", c: "1.0.1", d: "2.0.0" } });
	});

	test("updates dependency with existing version", () => {
		const pkg = {
			name: "a",
			_lastRelease: { version: "1.0.0" },
			_nextType: false,
			manifest: { name: "a", dependencies: { b: "*", c: "1.0.0", d: "1.0.0" } },
			localDeps: [
				{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
				{
					name: "c",
					_nextType: "patch",
					localDeps: [],
					_lastRelease: { version: "1.0.0" },
					_nextRelease: { version: "1.0.1" },
				},
				{
					name: "d",
					_nextType: "major",
					localDeps: [],
					_lastRelease: { version: "1.0.0" },
					_nextRelease: { version: "2.0.0" },
				},
			],
		};
		pkg._depsChanged = pkg.localDeps;

		updateManifestDeps(pkg, false);
		expect(pkg.manifest).toMatchObject({ name: "a", dependencies: { b: "1.0.0", c: "1.0.1", d: "2.0.0" } });
	});

	test("updates dependencies if mentioned twice", () => {
		const pkg = {
			name: "a",
			_lastRelease: { version: "1.0.0" },
			_nextType: false,
			manifest: { name: "a", dependencies: { b: "*", c: "1.0.0", d: "1.0.0" }, devDependencies: { c: "1.0.0" } },
			localDeps: [
				{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
				{
					name: "c",
					_nextType: "patch",
					localDeps: [],
					_lastRelease: { version: "1.0.0" },
					_nextRelease: { version: "1.0.1" },
				},
				{
					name: "d",
					_nextType: "major",
					localDeps: [],
					_lastRelease: { version: "1.0.0" },
					_nextRelease: { version: "2.0.0" },
				},
			],
		};
		pkg._depsChanged = pkg.localDeps;

		updateManifestDeps(pkg, false);
		expect(pkg.manifest).toMatchObject({
			name: "a",
			dependencies: { b: "1.0.0", c: "1.0.1", d: "2.0.0" },
			devDependencies: { c: "1.0.1" },
		});
	});
});

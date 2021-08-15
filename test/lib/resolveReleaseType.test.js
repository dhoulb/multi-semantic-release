const { iteratee } = require("lodash");
const { resolveReleaseType } = require("../../lib/updateDeps");

// Tests.
describe("resolveReleaseType()", () => {
	test("Works correctly with no deps", () => {
		expect(resolveReleaseType({ localDeps: [] })).toBe(undefined);
	});
	describe("Works correctly with deps", () => {
		test("does patch with no dependencies", () => {
			const pkg1 = { _nextType: "patch", localDeps: [] };
			expect(resolveReleaseType(pkg1)).toBe("patch");
			expect(pkg1._depsChanged.length).toBe(0);
		});

		test("new package", () => {
			const pkg2 = { _nextType: undefined, localDeps: [] };
			expect(resolveReleaseType(pkg2)).toBe(undefined);
			expect(pkg2._depsChanged.length).toBe(0);
		});

		test("new with dependencies", () => {
			const pkg3 = {
				_nextType: undefined,
				localDeps: [
					{ _nextType: false, localDeps: [] },
					{ _nextType: false, localDeps: [] },
				],
			};
			expect(resolveReleaseType(pkg3)).toBe(undefined);
			expect(pkg3._depsChanged.length).toBe(2);
		});

		test("upgrades if dependency upgrades", () => {
			const pkg4 = {
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{ name: "a", _nextType: "patch", localDeps: [], _lastRelease: { version: "1.0.0" } },
					{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
				],
				_lastRelease: { version: "1.0.0" },
			};
			expect(resolveReleaseType(pkg4)).toBe("patch");
			expect(pkg4._depsChanged.length).toBe(1);
			expect(pkg4._depsChanged[0].name).toBe("a");
		});

		test("doesn't do updates if no updates", () => {
			const pkg5 = {
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{ name: "a", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
					{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
				],
				_lastRelease: { version: "1.0.0" },
			};
			expect(resolveReleaseType(pkg5)).toBe(undefined);
			expect(pkg5._depsChanged.length).toBe(0);
		});

		test("inherits the highest update", () => {
			const pkg6 = {
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{
						name: "a",
						_lastRelease: { version: "1.0.0" },
						_nextType: false,
						manifest: { dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
						localDeps: [
							{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
							{ name: "c", _nextType: "patch", localDeps: [], _lastRelease: { version: "1.0.0" } },
							{ name: "d", _nextType: "major", localDeps: [], _lastRelease: { version: "1.0.0" } },
						],
					},
				],
				_lastRelease: { version: "1.0.0" },
			};

			//first round
			pkg6._nextType = resolveReleaseType(pkg6, "override", "inherit");
			pkg6.localDeps[0]._nextType = resolveReleaseType(pkg6.localDeps[0], "override", "inherit");
			pkg6.localDeps[0].localDeps.forEach(
				(dep) => (dep._nextType = resolveReleaseType(dep, "override", "inherit"))
			);

			expect(pkg6._nextType).toBe(undefined);
			expect(pkg6._depsChanged.length).toBe(0);
			expect(pkg6.localDeps[0]._nextType).toBe("major");
			expect(pkg6.localDeps[0]._depsChanged.length).toBe(2);
			expect(pkg6.localDeps[0].localDeps[0]._nextType).toBe(false);
			expect(pkg6.localDeps[0].localDeps[1]._nextType).toBe("patch");
			expect(pkg6.localDeps[0].localDeps[2]._nextType).toBe("major");

			//second round
			pkg6._nextType = resolveReleaseType(pkg6, "override", "inherit");
			pkg6.localDeps[0]._nextType = resolveReleaseType(pkg6.localDeps[0], "override", "inherit");
			pkg6.localDeps[0].localDeps.forEach(
				(dep) => (dep._nextType = resolveReleaseType(dep, "override", "inherit"))
			);

			expect(pkg6._nextType).toBe("major");
			expect(pkg6._depsChanged.length).toBe(1);
			expect(pkg6.localDeps[0]._nextType).toBe("major");
			expect(pkg6.localDeps[0]._depsChanged.length).toBe(2);
			expect(pkg6.localDeps[0].localDeps[0]._nextType).toBe(false);
			expect(pkg6.localDeps[0].localDeps[1]._nextType).toBe("patch");
			expect(pkg6.localDeps[0].localDeps[2]._nextType).toBe("major");
		});

		test("overrides dependent release type with custom value if defined", () => {
			const pkg6 = {
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{
						name: "a",
						_lastRelease: { version: "1.0.0" },
						_nextType: false,
						manifest: { dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
						localDeps: [
							{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
							{ name: "c", _nextType: "patch", localDeps: [], _lastRelease: { version: "1.0.0" } },
							{ name: "d", _nextType: "minor", localDeps: [], _lastRelease: { version: "1.0.0" } },
						],
					},
				],
				_lastRelease: { version: "1.0.0" },
			};

			//first round
			pkg6._nextType = resolveReleaseType(pkg6, undefined, "major");
			pkg6.localDeps[0]._nextType = resolveReleaseType(pkg6.localDeps[0], undefined, "major");
			pkg6.localDeps[0].localDeps.forEach((dep) => (dep._nextType = resolveReleaseType(dep, undefined, "major")));

			expect(pkg6._nextType).toBe(undefined);
			expect(pkg6._depsChanged.length).toBe(0);
			expect(pkg6.localDeps[0]._nextType).toBe("major");
			expect(pkg6.localDeps[0]._depsChanged.length).toBe(2);
			expect(pkg6.localDeps[0].localDeps[0]._nextType).toBe(false);
			expect(pkg6.localDeps[0].localDeps[1]._nextType).toBe("patch");
			expect(pkg6.localDeps[0].localDeps[2]._nextType).toBe("minor");

			//second round
			pkg6._nextType = resolveReleaseType(pkg6, undefined, "major");
			pkg6.localDeps[0]._nextType = resolveReleaseType(pkg6.localDeps[0], undefined, "major");
			pkg6.localDeps[0].localDeps.forEach((dep) => (dep._nextType = resolveReleaseType(dep, undefined, "major")));

			expect(pkg6._nextType).toBe("major");
			expect(pkg6._depsChanged.length).toBe(1);
			expect(pkg6.localDeps[0]._nextType).toBe("major");
			expect(pkg6.localDeps[0]._depsChanged.length).toBe(2);
			expect(pkg6.localDeps[0].localDeps[0]._nextType).toBe(false);
			expect(pkg6.localDeps[0].localDeps[1]._nextType).toBe("patch");
			expect(pkg6.localDeps[0].localDeps[2]._nextType).toBe("minor");
		});

		test("uses `patch` + override strategy as default (legacy flow)", () => {
			const pkg6 = {
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				_lastRelease: { version: "1.0.0" },
				localDeps: [
					{
						name: "a",
						_nextType: false,
						_lastRelease: { version: "1.0.0" },
						manifest: { dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
						localDeps: [
							{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" } },
							{ name: "c", _nextType: "minor", localDeps: [], _lastRelease: { version: "1.0.0" } },
							{ name: "d", _nextType: "major", localDeps: [], _lastRelease: { version: "1.0.0" } },
						],
					},
				],
			};

			//first round
			pkg6._nextType = resolveReleaseType(pkg6);
			pkg6.localDeps[0]._nextType = resolveReleaseType(pkg6.localDeps[0]);
			pkg6.localDeps[0].localDeps.forEach((dep) => (dep._nextType = resolveReleaseType(dep)));

			expect(pkg6._nextType).toBe(undefined);
			expect(pkg6._depsChanged.length).toBe(0);
			expect(pkg6.localDeps[0]._nextType).toBe("patch");
			expect(pkg6.localDeps[0]._depsChanged.length).toBe(2);
			expect(pkg6.localDeps[0].localDeps[0]._nextType).toBe(false);
			expect(pkg6.localDeps[0].localDeps[1]._nextType).toBe("minor");
			expect(pkg6.localDeps[0].localDeps[2]._nextType).toBe("major");

			//second round
			pkg6._nextType = resolveReleaseType(pkg6);
			pkg6.localDeps[0]._nextType = resolveReleaseType(pkg6.localDeps[0]);
			pkg6.localDeps[0].localDeps.forEach((dep) => (dep._nextType = resolveReleaseType(dep)));

			expect(pkg6._nextType).toBe("patch");
			expect(pkg6._depsChanged.length).toBe(1);
			expect(pkg6.localDeps[0]._nextType).toBe("patch");
			expect(pkg6.localDeps[0]._depsChanged.length).toBe(2);
			expect(pkg6.localDeps[0].localDeps[0]._nextType).toBe(false);
			expect(pkg6.localDeps[0].localDeps[1]._nextType).toBe("minor");
			expect(pkg6.localDeps[0].localDeps[2]._nextType).toBe("major");
		});
	});
	describe("No infinite loops", () => {
		test("self reference", () => {
			const pkg1 = {
				name: "a",
				_nextType: "minor",
				localDeps: [],
				_lastRelease: { version: "1.0.0" },
				manifest: { dependencies: { a: "1.0.0" } },
			};
			pkg1.localDeps.push(pkg1);

			expect(resolveReleaseType(pkg1, "override")).toBe("minor");
			expect(resolveReleaseType(pkg1, "satisfy")).toBe("minor");
			expect(resolveReleaseType(pkg1, "inherit")).toBe("minor");
			expect(resolveReleaseType(pkg1, "override", "patch")).toBe("minor");
			expect(resolveReleaseType(pkg1, "satisfy", "patch")).toBe("minor");
			expect(resolveReleaseType(pkg1, "inherit", "patch")).toBe("minor");

			//strange case, because of self-reference, dependency gets updated thus releaseType becomes major
			expect(resolveReleaseType(pkg1, "override", "major")).toBe("major");
			expect(resolveReleaseType(pkg1, "satisfy", "major")).toBe("major");
			expect(resolveReleaseType(pkg1, "inherit", "major")).toBe("major");
		});

		test("indirect self reference", () => {
			const pkga = {
				name: "a",
				_nextType: undefined,
				localDeps: [
					{
						name: "b",
						_nextType: "minor",
						localDeps: [],
						_lastRelease: { version: "1.0.0" },
						manifest: {},
					},
				],
				_lastRelease: { version: "1.0.0" },
				manifest: { dependencies: { b: "1.0.0" } },
			};

			const pkgb = pkga.localDeps[0];
			pkgb.localDeps.push(pkga);
			pkgb.manifest.dependencies = { a: "1.0.0" };

			//multiple rounds! (1 too many actually)
			for (let i = 0; i < 3; i++) {
				pkga._nextType = resolveReleaseType(pkga);
				pkgb._nextType = resolveReleaseType(pkgb);
			}

			expect(pkga._nextType).toBe("patch");
			expect(pkga._depsChanged.length).toBe(1);
			expect(pkga._depsChanged[0]).toBe(pkgb);
			expect(pkgb._nextType).toBe("minor");
			expect(pkgb._depsChanged.length).toBe(1);
			expect(pkgb._depsChanged[0]).toBe(pkga);
		});

		test("new with self reference", () => {
			const pkg2 = { _nextType: undefined, localDeps: [] };
			pkg2.localDeps.push(pkg2);
			expect(resolveReleaseType(pkg2)).toBe(undefined);
		});

		test("new with indirect self reference", () => {
			const pkg3 = {
				_nextType: undefined,
				localDeps: [
					{ _nextType: false, localDeps: [] },
					{ _nextType: false, localDeps: [] },
				],
			};
			pkg3.localDeps[0].localDeps.push(pkg3.localDeps[0]);
			expect(resolveReleaseType(pkg3)).toBe(undefined);
		});

		test("patch when dependency changes", () => {
			const pkg4 = {
				name: "pkg",
				manifest: { dependencies: { a: "1.0.0", b: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{ name: "a", _nextType: "patch", localDeps: [], _lastRelease: { version: "1.0.0" } },
					{ name: "b", _nextType: "major", localDeps: [], _lastRelease: { version: "1.0.0" } },
				],
				_lastRelease: { version: "1.0.0" },
			};
			pkg4.localDeps[0].localDeps.push(pkg4.localDeps[0]);
			pkg4.localDeps[0].manifest = pkg4.manifest;

			expect(resolveReleaseType(pkg4)).toBe("patch");
		});
	});
});

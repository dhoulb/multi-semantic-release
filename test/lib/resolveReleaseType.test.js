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
		});

		test("new package", () => {
			const pkg2 = { _nextType: undefined, localDeps: [] };
			expect(resolveReleaseType(pkg2)).toBe(undefined);
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
			expect(resolveReleaseType(pkg6, "override", "inherit")).toBe("major");
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
			expect(resolveReleaseType(pkg1)).toBe("minor");
		});

		test("indirect self reference", () => {
			const pkg1 = {
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
			pkg1.localDeps[0].localDeps.push(pkg1);
			pkg1.localDeps[0].manifest.dependencies = pkg1.manifest.dependencies;

			expect(resolveReleaseType(pkg1)).toBe("patch");
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

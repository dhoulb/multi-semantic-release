const wait = require("../../lib/wait");

// Test.
describe("wait()", () => {
	test("Works correctly", async () => {
		expect.assertions(1);
		let count = 1;
		const fn = jest.fn(() => 10 === count++);
		await wait(fn);
		expect(fn).toBeCalledTimes(10);
	});
});

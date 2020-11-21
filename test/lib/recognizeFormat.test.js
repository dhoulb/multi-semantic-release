const recognizeFormat = require("../../lib/recognizeFormat");

// Tests.
describe("recognizeFormat()", () => {
	describe("Indentation", () => {
		test("Normal indentation", () =>
			expect(
				recognizeFormat(`{
	"a": "b",
	"c": {
		"d": "e"
	}
}`).indent
			).toBe("\t"));
		test("No indentation", () => expect(recognizeFormat('{"a": "b"}').indent).toBe(""));
	});

	describe("Trailing whitespace", () => {
		test("No trailing whitespace", () => expect(recognizeFormat('{"a": "b"}').trailingWhitespace).toBe(""));
		test("Newline", () => expect(recognizeFormat('{"a": "b"}\n').trailingWhitespace).toBe("\n"));
		test("Multiple newlines", () => expect(recognizeFormat('{"a": "b"}\n\n').trailingWhitespace).toBe("\n"));
	});
});

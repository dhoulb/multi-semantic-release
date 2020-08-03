/**
 * Information about the format of a file.
 * @typedef FileFormat
 * @property {string|number} indent Indentation characters
 * @property {string} trailingWhitespace Trailing whitespace at the end of the file
 */

/**
 * Detects the indentation and trailing whitespace of a file.
 *
 * @param {string} contents contents of the file
 * @returns {FileFormat} Formatting of the file
 */
function recognizeFormat(contents) {
	const indentMatch = /\n([^"]+)/.exec(contents);
	const trailingWhitespaceMatch = /}(\s*)$/.exec(contents);

	return {
		indent: indentMatch ? indentMatch[1] : 2,
		trailingWhitespace: trailingWhitespaceMatch ? trailingWhitespaceMatch[1] : "",
	};
}

// Exports.
module.exports = recognizeFormat;

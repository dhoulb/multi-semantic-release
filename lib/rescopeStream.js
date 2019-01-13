const { check } = require("./blork");

/**
 * Create a stream that passes messages through while rewriting scope.
 * Replaces `[semantic-release]` with a custom scope (e.g. `[my-awesome-package]`) so output makes more sense.
 *
 * @param {stream.Writable} stream The actual stream to write messages to.
 * @param {string} scope The string scope for the stream (instances of the text `[semantic-release]` are replaced in the stream).
 * @returns {stream.Writable} Object that's compatible with stream.Writable (implements a `write()` property).
 */
function rescopeStream(stream, scope) {
	// Check args.
	check(scope, "scope: string");
	return {
		write(msg) {
			stream.write(msg.replace("[semantic-release]", `[${scope}]`));
		}
	};
}

// Exports.
module.exports = rescopeStream;

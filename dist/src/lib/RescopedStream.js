"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const blork_1 = require("./blork");
/**
 * Create a stream that passes messages through while rewriting scope.
 * Replaces `[semantic-release]` with a custom scope (e.g. `[my-awesome-package]`) so output makes more sense.
 *
 * @param stream The actual stream to write messages to.
 * @param scope The string scope for the stream (instances of the text `[semantic-release]` are replaced in the stream).
 * @returns Object that's compatible with stream.Writable (implements a `write()` property).
 *
 * @internal
 */
class RescopedStream extends stream_1.Writable {
    constructor(stream, scope) {
        super();
        blork_1.check(scope, 'scope: string');
        blork_1.check(stream, 'stream: stream');
        this._stream = stream;
        this._scope = scope;
    }
    // Custom write method.
    write(msg) {
        blork_1.check(msg, 'msg: string');
        return this._stream.write(msg.replace('[semantic-release]', `[${this._scope}]`));
    }
}
exports.default = RescopedStream;

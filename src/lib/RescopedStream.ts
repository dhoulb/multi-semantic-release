import { Writable } from 'stream'

import { check } from './blork'

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
export default class RescopedStream extends Writable {
  private readonly _stream: Writable
  private readonly _scope: string

  constructor(stream: Writable, scope: string) {
    super()
    check(scope, 'scope: string')
    check(stream, 'stream: stream')
    this._stream = stream
    this._scope = scope
  }

  // Custom write method.
  public write(msg: string) {
    check(msg, 'msg: string')
    return this._stream.write(
      msg.replace('[semantic-release]', `[${this._scope}]`),
    )
  }
}

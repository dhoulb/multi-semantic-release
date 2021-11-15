import { Signale } from 'signale'
import { WriteStream } from 'tty'

/**
 * Return a new Signale instance.
 * _Similar to get-logger.js in semantic-release_
 *
 * @param stdout A writable stream for output.
 * @param stderr A writable stream for errors.
 * @returns An instance of Logger
 *
 * @internal
 */
export default function getLogger({
  stdout,
  stderr,
  scope,
}: {
  stdout: WriteStream
  stderr: WriteStream
  scope?: string
}) {
  return new Signale({
    config: { displayTimestamp: true, displayLabel: false },
    scope,
    stream: stdout,
    types: {
      error: { color: 'red', label: '', stream: [stderr], badge: '✖' },
      log: { color: 'magenta', label: '', stream: [stdout], badge: 'ℹ' },
      success: { color: 'green', label: '', stream: [stdout], badge: '✔' },
      complete: { color: 'green', label: '', stream: [stdout], badge: '🎉' },
    },
  })
}

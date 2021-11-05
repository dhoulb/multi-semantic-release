"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signale_1 = require("signale");
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
function getLogger({ stdout, stderr, }) {
    return new signale_1.Signale({
        config: { displayTimestamp: true, displayLabel: false },
        // scope: "multirelease",
        stream: stdout,
        types: {
            error: { color: 'red', label: '', stream: [stderr], badge: '' },
            log: { color: 'magenta', label: '', stream: [stdout], badge: '•' },
            success: { color: 'green', label: '', stream: [stdout], badge: '' },
            complete: { color: 'green', label: '', stream: [stdout], badge: '🎉' },
        },
    });
}
exports.default = getLogger;

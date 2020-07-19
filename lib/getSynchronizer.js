const EventEmitter = require("promise-events");

/**
 * Cross-packages synchronization context.
 * @typedef Synchronizer
 * @param {EventEmitter} ee Shared signal bus
 */

/**
 * Creates shared signal bus and its assets.
 * @param {Package[]} packages The multi-semantic-release context.
 * @returns {Synchronizer} Shared sync assets.
 */
const getSynchronizer = (packages) => {
	const ee = new EventEmitter();

	return {
		ee,
	};
};

module.exports = getSynchronizer;

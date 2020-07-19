const EventEmitter = require("promise-events");
const { identity } = require("lodash");

/**
 * Cross-packages synchronization context.
 * @typedef Synchronizer
 * @param {EventEmitter} ee Shared signal bus
 * @param {Function} todo Gets the list of packages which are still todo
 * @params {Function} waitForAll return a promise that waits until all the packages have the same target probe value.
 * @params {Function} announce Attach expected state promise to target package.
 * @params {Function} announceForAll Attach expected state promise to all packages.
 */

/**
 * Creates shared signal bus and its assets.
 * @param {Package[]} packages The multi-semantic-release context.
 * @returns {Synchronizer} Shared sync assets.
 */
const getSynchronizer = (packages) => {
	const ee = new EventEmitter();
	const getEventName = (probe, pkg) => `${probe}${pkg ? ":" + pkg.name : ""}`;

	// List of packages which are still todo (don't yet have a result).
	const todo = () => packages.filter((p) => p.result === undefined);

	// Emitter with memo: next subscribers will receive promises from the past if exists.
	const store = {
		evt: {},
		subscr: {},
	};
	const emit = (probe, pkg) => {
		const name = getEventName(probe, pkg);

		return store.evt[name] || (store.evt[name] = ee.emit(name));
	};
	const once = (probe, pkg) => {
		const name = getEventName(probe, pkg);

		return store.evt[name] || store.subscr[name] || (store.subscr[name] = ee.once(name));
	};

	// Status sync point.
	const waitForAll = (probe, filter = identity) => {
		const promise = once(probe);

		if (
			todo()
				.filter(filter)
				.every((p) => p.hasOwnProperty(probe))
		) {
			emit(probe);
		}

		return promise;
	};

	const announce = (probe, pkg) => (pkg[probe] = once(probe, pkg));
	const announceForAll = (probe) => todo().forEach((p) => announce(probe, p));

	// Only the first lucky package passes the probe.
	const getLucky = (probe, pkg) => {
		if (getLucky[probe]) {
			return;
		}

		getLucky[probe] = emit(probe, pkg);
	};

	return {
		ee,
		emit,
		once,
		todo,
		announce,
		announceForAll,
		waitForAll,
		getLucky,
	};
};

module.exports = getSynchronizer;

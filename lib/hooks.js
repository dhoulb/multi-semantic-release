/**
 * NOTE this workaround forces execa calls to be always sync
 * Discussion: https://github.com/semantic-release/semantic-release/issues/193#issuecomment-462063871
 * @private
 * @type {{hook: hook, unhook: unhook}}
 */
const execa = (() => {
	const ritm = require("require-in-the-middle");
	const { queuefy } = require("queuefy");
	const _execa = require("execa");
	const uncache = name => delete require.cache[require.resolve(name)];
	const execaQueued = Object.assign(queuefy(_execa), _execa);
	const execaSynced = Object.assign((...args) => {
		const result = new Promise((resolve, reject) => {
			try {
				resolve(_execa.sync(...args));
			} catch (e) {
				reject(e);
			}
		});

		result.stdout = new String("");
		result.stderr = new String("");
		result.stdout.pipe = () => {};
		result.stderr.pipe = () => {};

		return result;
	}, _execa);

	let interceptor;

	const hook = type => {
		const execaHooked = type === "queue" ? execaQueued : execaSynced;

		if (interceptor) {
			return;
		}

		interceptor = ritm(["execa"], () => execaHooked);
		uncache("execa");

		console.log('"execa" hooked');
	};

	const unhook = () => {
		if (interceptor) {
			interceptor.unhook();
			interceptor = null;
			uncache("execa");

			console.log('"execa" unhooked');
		}
	};

	return {
		hook,
		unhook
	};
})();

/**
 * @private
 * @type {{hook: hook, unhook: unhook}}
 */
const spawn = (() => {
	const childProcess = require("child_process");
	const oldSpawn = childProcess.spawn;

	const watchSpawn = (...args) => {
		console.log("spawn called");
		console.log(...args);

		return oldSpawn.call(childProcess, ...args);
	};
	const hook = () => {
		if (childProcess.spawn === oldSpawn) {
			childProcess.spawn = watchSpawn;
		}
	};

	const unhook = () => {
		if (childProcess.spawn === watchSpawn) {
			childProcess.spawn = oldSpawn;
		}
	};

	return {
		hook,
		unhook
	};
})();

module.exports = {
	execa,
	spawn
};

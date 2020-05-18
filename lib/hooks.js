/**
 * @private
 * @type {{hook: hook, unhook: unhook}}
 */
const queue = (() => {
	const ritm = require("require-in-the-middle");
	const { each } = require("lodash");
	const { queuefy } = require("queuefy");
	const plugins = [ // eslint-disable-line
		"@semantic-release/commit-analyzer",
		"@semantic-release/release-notes-generator",
		"@semantic-release/npm",
		"@semantic-release/git",
		"@semantic-release/github"
	];
	const _hooks = [];

	const hook = () => {
		each(plugins, pluginName => {
			const plugin = require(pluginName);

			each(plugin, (handler, ref) => {
				plugin[ref] = queuefy(handler);
			});

			_hooks.push(ritm([pluginName], () => plugin));
			uncache(pluginName);

			console.log(`hooked plugin '${pluginName}'`);
		});
	};

	const unhook = () => {
		each(_hooks, _hook => _hook.unhook());
		each(plugins, pluginName => {
			uncache(pluginName);
			console.log(`unhooked plugin '${pluginName}'`);
		});
		_hooks.lenght = 0;
	};

	return {
		hook,
		unhook
	};
})();

/**
 * NOTE this workaround forces execa calls to be always sync
 * Discussion: https://github.com/semantic-release/semantic-release/issues/193#issuecomment-462063871
 * @private
 * @type {{hook: hook, unhook: unhook}}
 */
const execa = (() => {
	const ritm = require("require-in-the-middle");
	const _execa = require("execa");
	const uncache = name => delete require.cache[require.resolve(name)];
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

	const hook = () => {
		if (interceptor) {
			return;
		}

		interceptor = ritm(["execa"], () => execaSynced);
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

/**
 * @private
 * @param {string} name Pkg name
 * @return {boolean} Deletion result
 */
const uncache = name => delete require.cache[require.resolve(name)];

module.exports = {
	execa,
	spawn,
	queue
};

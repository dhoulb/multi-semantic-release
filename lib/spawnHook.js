const childProcess = require("child_process");
const oldSpawn = childProcess.spawn;

const watchSpawn = (...args) => {
	console.log("spawn called");
	console.log(...args);

	return oldSpawn.apply(this, ...args);
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

module.exports = {
	hook,
	unhook
};

#!/usr/bin/env node

const meow = require("meow");
const pairs = require("lodash.pairs");
const set = require("lodash.set");
const runner = require("./runner");
const cli = meow(
	`
  Usage
    $ multi-semantic-release

  Options
    --sync,       Forces all execa calls to be synchronous
    --debug,      Enables all additional logging
    --debug.spawn Turns on logging for process.spawn

  Examples
    $ multi-semantic-release --sync --debug
    $ multi-semantic-release --debug.spawn
`,
	{
		flags: {
			sync: {
				type: "boolean",
				alias: "execasync" // Legacy
			},
			debug: {
				type: "boolean"
			}
		}
	}
);

const processFlags = flags => pairs(flags).reduce((m, [k, v]) => set(m, k, v), {});

runner(processFlags(cli.flags));

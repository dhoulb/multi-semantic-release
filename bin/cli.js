#!/usr/bin/env node

const meow = require("meow");
const { toPairs, set } = require("lodash");
const runner = require("./runner");
const cli = meow(
	`
  Usage
    $ multi-semantic-release

  Options
    --execasync,    Forces all execa calls to be synchronous
    --watchspawn    Turns on logging for process.spawn

  Examples
    $ multi-semantic-release --execasync --watchspawn
    $ multi-semantic-release --execaqueue
`,
	{
		flags: {
			execasync: {
				type: "boolean",
				alias: "sync"
			},
			execaqueue: {
				type: "boolean"
			},
			watchspawn: {
				type: "boolean"
			}
		}
	}
);

const processFlags = flags => toPairs(flags).reduce((m, [k, v]) => set(m, k, v), {});

runner(processFlags(cli.flags));

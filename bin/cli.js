#!/usr/bin/env node

const meow = require("meow");
const { toPairs, set } = require("lodash");
const runner = require("./runner");
const cli = meow(
	`
  Usage
    $ multi-semantic-release

  Options
    --execasync     Forces all execa calls to be synchronous
    --queuefy       Makes plugins methods work like a single thread with a queue
    --watchspawn    Turns on logging for process.spawn

  Examples
    $ multi-semantic-release --execasync --watchspawn
    $ multi-semantic-release --queuefy
`,
	{
		flags: {
			execasync: {
				type: "boolean",
				alias: "sync"
			},
			queuefy: {
				type: "boolean",
				alias: "queue"
			},
			watchspawn: {
				type: "boolean"
			}
		}
	}
);

const processFlags = flags => toPairs(flags).reduce((m, [k, v]) => set(m, k, v), {});

runner(processFlags(cli.flags));

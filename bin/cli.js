#!/usr/bin/env node

const meow = require("meow");
const { toPairs, set } = require("lodash");
const runner = require("./runner");
const cli = meow(
	`
  Usage
    $ multi-semantic-release

  Options
    --sequential-init  Avoid hypothetical concurrent initialization collisions.
    --debug Output debugging information.
    --first-parent Apply commit filtering to current branch only.
    --help Help info.

  Examples
    $ multi-semantic-release
`,
	{
		flags: {
			sequentialInit: {
				type: "boolean",
			},
			firstParent: {
				type: "boolean",
			},
			debug: {
				type: "boolean",
			},
		},
	}
);

const processFlags = (flags) => toPairs(flags).reduce((m, [k, v]) => set(m, k, v), {});

runner(processFlags(cli.flags));

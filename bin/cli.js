#!/usr/bin/env node

const meow = require("meow");
const { toPairs, set } = require("lodash");
const runner = require("./runner");
const cli = meow(
	`
  Usage
    $ multi-semantic-release

  Options
    --debug Output debugging information.
    --sequential-init  Avoid hypothetical concurrent initialization collisions.
    --first-parent Apply commit filtering to current branch only.
    --deps.bump Define deps version updating rule. Allowed: override, satisfy, inherit.
    --deps.release Define release type for dependent package if any of its deps changes. Supported values: patch, minor, major, inherit.
    --help Help info.

  Examples
    $ multi-semantic-release --debug
    $ multi-semantic-release --deps.bump=satisfy --deps.release=patch
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
			"deps.bump": {
				type: "string",
				default: "override",
			},
			"deps.release": {
				type: "string",
				default: "patch",
			},
		},
	}
);

const processFlags = (flags) => toPairs(flags).reduce((m, [k, v]) => set(m, k, v), {});

runner(processFlags(cli.flags));

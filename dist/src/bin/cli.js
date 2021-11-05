#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const meow_1 = __importDefault(require("meow"));
const lodash_1 = require("lodash");
const runner_1 = __importDefault(require("./runner"));
const cli = meow_1.default(`
  Usage
    $ multi-semantic-release

  Options
    --dry-run Dry run mode.
    --debug Output debugging information.
    --first-parent Apply commit filtering to current branch only.
    --deps.bump Define deps version updating rule. Allowed: override, satisfy, inherit.
    --deps.release Define release type for dependent package if any of its deps changes. Supported values: patch, minor, major, inherit.
	--ignore-packages  Packages' list to be ignored on bumping process
    --help Help info.

  Examples
    $ multi-semantic-release --debug
    $ multi-semantic-release --deps.bump=satisfy --deps.release=patch
	$ multi-semantic-release --ignore-packages=packages/a/**,packages/b/**
`, {
    flags: {
        firstParent: {
            type: 'boolean',
        },
        debug: {
            type: 'boolean',
        },
        'deps.bump': {
            type: 'string',
            default: 'override',
        },
        'deps.release': {
            type: 'string',
            default: 'patch',
        },
        ignorePackages: {
            type: 'string',
        },
        dryRun: {
            type: 'boolean',
        },
    },
});
const processFlags = (flags) => {
    return lodash_1.toPairs(flags).reduce((m, [k, v]) => {
        if (k === 'ignorePackages' && v && typeof v === 'string')
            return lodash_1.set(m, k, v.split(','));
        return lodash_1.set(m, k, v);
    }, {});
};
runner_1.default(processFlags(cli.flags));

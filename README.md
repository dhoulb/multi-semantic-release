# @qiwi/multi-semantic-release
hacky [semantic-release](https://github.com/semantic-release/semantic-release) for monorepos

[![Travis CI](https://travis-ci.com/qiwi/multi-semantic-release.svg?branch=master)](https://travis-ci.com/qiwi/multi-semantic-release)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat)](https://github.com/semantic-release/semantic-release)
[![Maintainability](https://api.codeclimate.com/v1/badges/c6ee027803a794f1d67d/maintainability)](https://codeclimate.com/github/qiwi/multi-semantic-release/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c6ee027803a794f1d67d/test_coverage)](https://codeclimate.com/github/qiwi/multi-semantic-release/test_coverage)

This fork of [dhoub/multi-semantic-release](https://github.com/dhoulb/multi-semantic-release) replaces [`setImmediate` loops](https://github.com/dhoulb/multi-semantic-release/blob/561a8e66133d422d88008c32c479d1148876aba4/lib/wait.js#L13) 
and [`execa.sync` hooks](https://github.com/dhoulb/multi-semantic-release/blob/561a8e66133d422d88008c32c479d1148876aba4/lib/execaHook.js#L5) with event-driven flow and finally makes possible to run the most release operations in parallel.  
🎉 🎉 🎉

## Install

```sh
yarn add @qiwi/multi-semantic-release --dev
```

## Usage

```sh
multi-semantic-release
```

## Configuration
**MSR** requires **semrel** config to be added [in any supported format](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration) for each package or/and declared in repo root (`globalConfig` is extremely useful if all the modules have the same strategy of release).  
NOTE config resolver joins `globalConfig` and `packageConfig` during execution.
```javascript
// Load the package-specific options.
const { options: pkgOptions } = await getConfig(dir);

// The 'final options' are the global options merged with package-specific options.
// We merge this ourselves because package-specific options can override global options.
const finalOptions = Object.assign({}, globalOptions, pkgOptions);
```

## Verified examples
We use this tool to release our JS platform code inhouse (GitHub Enterprise + JB TeamCity) and for our OSS (GitHub + Travis CI). Guaranteed working configurations available in projects.
* [qiwi/substrate](https://github.com/qiwi/substrate)
* [qiwi/json-rpc](https://github.com/qiwi/json-rpc)
* [qiwi/lint-config-qiwi](https://github.com/qiwi/lint-config-qiwi)

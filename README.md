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

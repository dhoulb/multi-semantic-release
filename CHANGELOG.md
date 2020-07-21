# [3.6.0](https://github.com/qiwi/multi-semantic-release/compare/v3.5.1...v3.6.0) (2020-07-21)


### Features

* add some debug messages ([ec792e1](https://github.com/qiwi/multi-semantic-release/commit/ec792e15a4223880054186035571f8ca647add0e))

## [3.5.1](https://github.com/qiwi/multi-semantic-release/compare/v3.5.0...v3.5.1) (2020-07-20)


### Performance Improvements

* various synchronizer optimizations ([87a7602](https://github.com/qiwi/multi-semantic-release/commit/87a760293fd97ab3aeaf361a256659897c96af9c))

# [3.5.0](https://github.com/qiwi/multi-semantic-release/compare/v3.4.0...v3.5.0) (2020-07-20)


### Features

* **debug:** print passed cli flags ([d720cd7](https://github.com/qiwi/multi-semantic-release/commit/d720cd717b2b99fa32a2d6a438a5142ebc453c26))

# [3.4.0](https://github.com/qiwi/multi-semantic-release/compare/v3.3.0...v3.4.0) (2020-07-19)


### Features

* add sequential-init flag to avoid hypothetical concurrent initialization collisions ([348678e](https://github.com/qiwi/multi-semantic-release/commit/348678ef1997ec914c0471bd60e47b987244ba54))

# [3.3.0](https://github.com/qiwi/multi-semantic-release/compare/v3.2.0...v3.3.0) (2020-07-17)


### Features

* support workspace.packages notation ([4a606b2](https://github.com/qiwi/multi-semantic-release/commit/4a606b2ceffcd70e18c015d51e62cda78f4cf58e))

# [3.2.0](https://github.com/qiwi/multi-semantic-release/compare/v3.1.0...v3.2.0) (2020-07-14)


### Features

* apply --first-parent filter to commits ([14a896b](https://github.com/qiwi/multi-semantic-release/commit/14a896b5e501e6c900b8d89ee16ff17289c1d3a1))

# [3.1.0](https://github.com/qiwi/multi-semantic-release/compare/v3.0.3...v3.1.0) (2020-07-07)


### Features

* uphold the prev package.json indents ([ac5832f](https://github.com/qiwi/multi-semantic-release/commit/ac5832f20c8218c95fc46719cbd532732db53419))

## [3.0.3](https://github.com/qiwi/multi-semantic-release/compare/v3.0.2...v3.0.3) (2020-06-26)


### Bug Fixes

* override env.TRAVIS_PULL_REQUEST_BRANCH to fix PR checks on travis-ci ([e4b1929](https://github.com/qiwi/multi-semantic-release/commit/e4b192971f3cba0ad8e341cdc64116285a9de220)), closes [#11](https://github.com/qiwi/multi-semantic-release/issues/11)

## [3.0.2](https://github.com/qiwi/multi-semantic-release/compare/v3.0.1...v3.0.2) (2020-06-16)


### Bug Fixes

* allow any `todo` package to run the `generateNotes` queue ([26a87d7](https://github.com/qiwi/multi-semantic-release/commit/26a87d7f88c09417b47b55fe6e21edb6d13f5520)), closes [#9](https://github.com/qiwi/multi-semantic-release/issues/9)

## [3.0.1](https://github.com/qiwi/multi-semantic-release/compare/v3.0.0...v3.0.1) (2020-06-05)


### Bug Fixes

* filter queued packages on generateNotes stage ([e0625ce](https://github.com/qiwi/multi-semantic-release/commit/e0625ced9c52d027246b58305d8206c949b4958c)), closes [#6](https://github.com/qiwi/multi-semantic-release/issues/6)

# [3.0.0](https://github.com/qiwi/multi-semantic-release/compare/v2.6.4...v3.0.0) (2020-06-04)


### Features

* **engine:** up nodejs version ([10af385](https://github.com/qiwi/multi-semantic-release/commit/10af3850de9cc04a1f4a85c505752b659e3f47ff))


### BREAKING CHANGES

* **engine:** the latest semantic-release requires Node.js 10.18

## [2.6.4](https://github.com/qiwi/multi-semantic-release/compare/v2.6.3...v2.6.4) (2020-05-28)


### Performance Improvements

* deps revision ([4f62817](https://github.com/qiwi/multi-semantic-release/commit/4f628175669ef025f91b2c2cdacafd37252a7f87))

## [2.6.3](https://github.com/qiwi/multi-semantic-release/compare/v2.6.2...v2.6.3) (2020-05-28)


### Performance Improvements

* straighten plugins execution pipeline ([e57fe2f](https://github.com/qiwi/multi-semantic-release/commit/e57fe2fc3274d66520fbeacdac488b1a29430835)), closes [#4](https://github.com/qiwi/multi-semantic-release/issues/4)

## [2.6.2](https://github.com/qiwi/multi-semantic-release/compare/v2.6.1...v2.6.2) (2020-05-22)


### Bug Fixes

* beautify log labels ([78cbc8a](https://github.com/qiwi/multi-semantic-release/commit/78cbc8a773076c370f43894d35423a0a23b0cafb))

## [2.6.1](https://github.com/qiwi/multi-semantic-release/compare/v2.6.0...v2.6.1) (2020-05-22)


### Bug Fixes

* provide partial release ([898998a](https://github.com/qiwi/multi-semantic-release/commit/898998a25f100e3450b14dd55ea6c468d3a02432))

# [2.6.0](https://github.com/qiwi/multi-semantic-release/compare/v2.5.0...v2.6.0) (2020-05-21)


### Features

* let publish step run in parallel ([4d5c451](https://github.com/qiwi/multi-semantic-release/commit/4d5c451e9400437820002a54a297a3c031856997))

# [2.5.0](https://github.com/qiwi/multi-semantic-release/compare/v2.4.3...v2.5.0) (2020-05-20)


### Bug Fixes

* publish updated deps ([791f55a](https://github.com/qiwi/multi-semantic-release/commit/791f55a34574f5e6531ed69f182ffd54b68e2450)), closes [#1](https://github.com/qiwi/multi-semantic-release/issues/1)


### Features

* add execa queued hook ([042933e](https://github.com/qiwi/multi-semantic-release/commit/042933eb619e3fb7111a8e1d4a41e3593e2729ca))
* apply queuefy to plugin methods instead of execa ([9ae7d0d](https://github.com/qiwi/multi-semantic-release/commit/9ae7d0d8c1cc9300517733fe9e4edcb557069dff))

## [2.4.3](https://github.com/qiwi/multi-semantic-release/compare/v2.4.2...v2.4.3) (2020-03-08)


### Performance Improvements

* log yarn paths ([3896d5c](https://github.com/qiwi/multi-semantic-release/commit/3896d5ca4e97870e37d2f254e3586cb5b9165b84))

## [2.4.2](https://github.com/qiwi/multi-semantic-release/compare/v2.4.1...v2.4.2) (2020-03-07)


### Bug Fixes

* make logger to be singleton ([1790794](https://github.com/qiwi/multi-semantic-release/commit/179079420368d4a33505adca3079c06eddad928d))

## [2.4.1](https://github.com/qiwi/multi-semantic-release/compare/v2.4.0...v2.4.1) (2020-03-07)


### Performance Improvements

* log improvements ([c45dccc](https://github.com/qiwi/multi-semantic-release/commit/c45dcccd3e81b9ce0489a920ce16f9616b4ebda0))

# [2.4.0](https://github.com/qiwi/multi-semantic-release/compare/v2.3.3...v2.4.0) (2020-03-07)


### Features

* log manifest path ([db451e8](https://github.com/qiwi/multi-semantic-release/commit/db451e877e53e54487019978ee20bd03c64fa992))

## [2.3.3](https://github.com/qiwi/multi-semantic-release/compare/v2.3.2...v2.3.3) (2020-03-07)


### Bug Fixes

* fix logger path ([232d2dc](https://github.com/qiwi/multi-semantic-release/commit/232d2dc62ce440bf58ff7d05df5d27f72f24cfe6))

## [2.3.2](https://github.com/qiwi/multi-semantic-release/compare/v2.3.1...v2.3.2) (2020-03-07)


### Performance Improvements

* log multi-sem-rel flags ([75389e0](https://github.com/qiwi/multi-semantic-release/commit/75389e06b97f39bfd3e5a797677ee835bc569557))

## [2.3.1](https://github.com/qiwi/multi-semantic-release/compare/v2.3.0...v2.3.1) (2020-03-07)


### Bug Fixes

* fix debug logging ([71527b2](https://github.com/qiwi/multi-semantic-release/commit/71527b2578a0a559ac1b175936d72e043258fe04))

# [2.3.0](https://github.com/qiwi/multi-semantic-release/compare/v2.2.0...v2.3.0) (2020-03-06)


### Features

* add debugger ([d2c090d](https://github.com/qiwi/multi-semantic-release/commit/d2c090daa104d19d71a09e54c7ff396d0f5824df))

# [2.2.0](https://github.com/qiwi/multi-semantic-release/compare/v2.1.3...v2.2.0) (2020-03-06)


### Features

* add meow as cli provider ([6de93b9](https://github.com/qiwi/multi-semantic-release/commit/6de93b9d7d5f818cccf5a376222e091d3be34065))

## [2.1.3](https://github.com/qiwi/multi-semantic-release/compare/v2.1.2...v2.1.3) (2020-03-05)


### Bug Fixes

* try to prevent deps update rollback ([9108350](https://github.com/qiwi/multi-semantic-release/commit/910835046bc6dc5e63d637d83276d945df6f1943))

## [2.1.2](https://github.com/qiwi/multi-semantic-release/compare/v2.1.1...v2.1.2) (2020-02-13)


### Bug Fixes

* **cli:** fix inner spawnhook call ([70aa292](https://github.com/qiwi/multi-semantic-release/commit/70aa2927cd52a374f1626ab514a836bc9d98edaa))

## [2.1.1](https://github.com/qiwi/multi-semantic-release/compare/v2.1.0...v2.1.1) (2020-02-13)


### Bug Fixes

* **cli:** restore watchspawn context ([56145aa](https://github.com/qiwi/multi-semantic-release/commit/56145aaae5b43065c9925ed661302216e649112f))

# [2.1.0](https://github.com/qiwi/multi-semantic-release/compare/v2.0.1...v2.1.0) (2020-02-13)


### Features

* add process.spawn arg watcher ([7699b6f](https://github.com/qiwi/multi-semantic-release/commit/7699b6f4058934cbcf51b196d7f6aaa13372b35a))

## [2.0.1](https://github.com/qiwi/multi-semantic-release/compare/v2.0.0...v2.0.1) (2020-02-11)


### Performance Improvements

* **package:** up deps ([6b903a7](https://github.com/qiwi/multi-semantic-release/commit/6b903a7e318326c53cbd9cfb201546d84e650c32))

# [2.0.0](https://github.com/qiwi/multi-semantic-release/compare/v1.2.0...v2.0.0) (2020-01-19)


### Features

* drop nodejs v8 support ([80f0a24](https://github.com/qiwi/multi-semantic-release/commit/80f0a242e195c6b4f7d6a68cdcbff9a25cd5577f))


### Performance Improvements

* **package:** up deps & tech release ([bf00b41](https://github.com/qiwi/multi-semantic-release/commit/bf00b41662805ba87d67865830c7b0d8d88e20b9))


### BREAKING CHANGES

* drop nodejs v8

# [1.2.0](https://github.com/qiwi/multi-semantic-release/compare/v1.1.0...v1.2.0) (2019-11-03)


### Features

* tech release ([828a82d](https://github.com/qiwi/multi-semantic-release/commit/828a82d88d0692aa3bc19dd8dae5674a46a719ce))

# [1.1.0](https://github.com/qiwi/multi-semantic-release/compare/v1.0.3...v1.1.0) (2019-11-03)


### Bug Fixes

* **package:** add missed sem-rel plugins ([f3c9318](https://github.com/qiwi/multi-semantic-release/commit/f3c9318aa76ac7ec10c4bb45782d8d775b1885d9))
* **package:** update execa to be compatible with sem-rel 15.13.28 ([069bb4e](https://github.com/qiwi/multi-semantic-release/commit/069bb4e943223a712398b35f78abcfc2a43b6323)), closes [#7](https://github.com/qiwi/multi-semantic-release/issues/7)
* force a release ([1e3ece5](https://github.com/qiwi/multi-semantic-release/commit/1e3ece5e03a5e39a2e100edaf8bead26245d0a12))


### Features

* add execasync CLI flag to make execa calls be always synchronous ([693438c](https://github.com/qiwi/multi-semantic-release/commit/693438caeb64af083a6db4e6634aaac74da112ad)), closes [#1](https://github.com/qiwi/multi-semantic-release/issues/1)

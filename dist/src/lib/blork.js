"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueError = exports.check = exports.checker = void 0;
const fs_1 = require("fs");
const blork_1 = require("blork");
Object.defineProperty(exports, "ValueError", { enumerable: true, get: function () { return blork_1.ValueError; } });
Object.defineProperty(exports, "check", { enumerable: true, get: function () { return blork_1.check; } });
Object.defineProperty(exports, "checker", { enumerable: true, get: function () { return blork_1.checker; } });
const stream_1 = require("stream");
const stream_buffers_1 = require("stream-buffers");
// Get some checkers.
const isAbsolute = blork_1.checker('absolute');
// Add a directory checker.
blork_1.add('directory', v => isAbsolute(v) && fs_1.existsSync(v) && fs_1.lstatSync(v).isDirectory(), 'directory that exists in the filesystem');
// Add a writable stream checker.
blork_1.add('stream', 
// istanbul ignore next (not important)
v => v instanceof stream_1.Writable || v instanceof stream_buffers_1.WritableStreamBuffer, 'instance of stream.Writable or WritableStreamBuffer');

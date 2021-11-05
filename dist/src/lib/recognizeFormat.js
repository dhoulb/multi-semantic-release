"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const detect_newline_1 = __importDefault(require("detect-newline"));
const detect_indent_1 = __importDefault(require("detect-indent"));
/**
 * Detects the indentation and trailing whitespace of a file.
 *
 * @param contents contents of the file
 * @returns Formatting of the file
 */
function recognizeFormat(contents) {
    var _a;
    return {
        indent: detect_indent_1.default(contents).indent,
        trailingWhitespace: (_a = detect_newline_1.default(contents)) !== null && _a !== void 0 ? _a : '',
    };
}
exports.default = recognizeFormat;

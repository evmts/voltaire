/**
 * Type definitions for WebAssembly FFI layer.
 * Defines all WASM exports and memory management types.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 */
/**
 * Error codes returned by WASM functions.
 *
 * @see https://voltaire.tevm.sh/getting-started for documentation
 * @since 0.0.0
 * @example
 * ```typescript
 * import { ErrorCode } from './wasm-loader/types.js';
 * if (result === ErrorCode.INVALID_HEX) {
 *   console.error('Invalid hex string');
 * }
 * ```
 */
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["SUCCESS"] = 0] = "SUCCESS";
    ErrorCode[ErrorCode["INVALID_HEX"] = -1] = "INVALID_HEX";
    ErrorCode[ErrorCode["INVALID_LENGTH"] = -2] = "INVALID_LENGTH";
    ErrorCode[ErrorCode["INVALID_CHECKSUM"] = -3] = "INVALID_CHECKSUM";
    ErrorCode[ErrorCode["OUT_OF_MEMORY"] = -4] = "OUT_OF_MEMORY";
    ErrorCode[ErrorCode["INVALID_INPUT"] = -5] = "INVALID_INPUT";
    ErrorCode[ErrorCode["INVALID_SIGNATURE"] = -6] = "INVALID_SIGNATURE";
    ErrorCode[ErrorCode["INVALID_SELECTOR"] = -7] = "INVALID_SELECTOR";
    ErrorCode[ErrorCode["UNSUPPORTED_TYPE"] = -8] = "UNSUPPORTED_TYPE";
    ErrorCode[ErrorCode["MAX_LENGTH_EXCEEDED"] = -9] = "MAX_LENGTH_EXCEEDED";
    ErrorCode[ErrorCode["ACCESS_LIST_INVALID"] = -10] = "ACCESS_LIST_INVALID";
    ErrorCode[ErrorCode["AUTHORIZATION_INVALID"] = -11] = "AUTHORIZATION_INVALID";
    ErrorCode[ErrorCode["KZG_NOT_LOADED"] = -20] = "KZG_NOT_LOADED";
    ErrorCode[ErrorCode["KZG_INVALID_BLOB"] = -21] = "KZG_INVALID_BLOB";
    ErrorCode[ErrorCode["KZG_INVALID_PROOF"] = -22] = "KZG_INVALID_PROOF";
})(ErrorCode || (ErrorCode = {}));

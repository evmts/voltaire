/**
 * Decode ERC-7751 wrapped error data
 *
 * Decodes a WrappedError from encoded bytes following the ERC-7751 specification.
 * Expects data to start with the WrappedError selector (0x90bfb865).
 *
 * @param {Uint8Array} data - Encoded error data (selector + ABI-encoded params)
 * @returns {import('./WrappedErrorType.js').WrappedErrorType} Decoded wrapped error
 * @throws {AbiDecodingError} If data is too short to contain selector
 * @throws {AbiInvalidSelectorError} If selector doesn't match WrappedError selector
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @example
 * ```javascript
 * import * as WrappedError from './primitives/Abi/error/wrapped/index.js';
 *
 * const decoded = WrappedError.decodeWrappedError(errorData);
 * console.log(decoded.target); // Address of failing contract
 * console.log(decoded.selector); // Function selector
 * console.log(decoded.reason); // Original revert reason
 * ```
 */
export function decodeWrappedError(data: Uint8Array): import("./WrappedErrorType.js").WrappedErrorType;
//# sourceMappingURL=decodeWrappedError.d.ts.map
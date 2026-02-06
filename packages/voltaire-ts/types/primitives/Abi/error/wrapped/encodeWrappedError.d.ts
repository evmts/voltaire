/**
 * Encode ERC-7751 wrapped error data
 *
 * Encodes a WrappedError following the ERC-7751 specification:
 * error WrappedError(address target, bytes4 selector, bytes reason, bytes details)
 *
 * @param {import('./WrappedErrorType.js').WrappedErrorType} wrappedError - Wrapped error data
 * @returns {Uint8Array} Encoded error data (selector + ABI-encoded params)
 * @see https://eips.ethereum.org/EIPS/eip-7751
 * @example
 * ```javascript
 * import * as WrappedError from './primitives/Abi/error/wrapped/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Selector from './primitives/Selector/index.js';
 *
 * const encoded = WrappedError.encodeWrappedError({
 *   target: Address.from('0x1234...'),
 *   selector: Selector.fromHex('0xabcd1234'),
 *   reason: new Uint8Array([...]),
 *   details: new Uint8Array([...])
 * });
 * ```
 */
export function encodeWrappedError(wrappedError: import("./WrappedErrorType.js").WrappedErrorType): Uint8Array;
//# sourceMappingURL=encodeWrappedError.d.ts.map
import { encodeParameters } from "../../Encoding.js";
import { WRAPPED_ERROR_SELECTOR } from "./constants.js";

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
export function encodeWrappedError(wrappedError) {
	const params = [
		{ name: "target", type: "address" },
		{ name: "selector", type: "bytes4" },
		{ name: "reason", type: "bytes" },
		{ name: "details", type: "bytes" },
	];

	const values = [
		wrappedError.target,
		wrappedError.selector,
		wrappedError.reason,
		wrappedError.details,
	];

	const encodedParams = encodeParameters(/** @type {any} */ (params), values);

	// Prepend selector
	const result = new Uint8Array(4 + encodedParams.length);
	result.set(WRAPPED_ERROR_SELECTOR, 0);
	result.set(encodedParams, 4);

	return result;
}

import { Address } from "../../../Address/index.js";
import * as Selector from "../../../Selector/index.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "../../Errors.js";
import { decodeParameters } from "../../Encoding.js";
import { WRAPPED_ERROR_SELECTOR } from "./constants.js";

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
export function decodeWrappedError(data) {
	if (data.length < 4) {
		throw new AbiDecodingError("Data too short to contain selector", {
			context: { dataLength: data.length, minLength: 4 },
			docsPath: "/primitives/abi/error/wrapped",
		});
	}

	// Verify selector
	const selector =
		/** @type {import('../../../Selector/SelectorType.js').SelectorType} */ (
			data.slice(0, 4)
		);
	if (!Selector.equals(selector, WRAPPED_ERROR_SELECTOR)) {
		throw new AbiInvalidSelectorError(
			`Invalid WrappedError selector: expected ${Selector.toHex(WRAPPED_ERROR_SELECTOR)}, got ${Selector.toHex(selector)}`,
			{
				value: Selector.toHex(selector),
				expected: Selector.toHex(WRAPPED_ERROR_SELECTOR),
				docsPath: "/primitives/abi/error/wrapped",
			},
		);
	}

	const params = [
		{ name: "target", type: "address" },
		{ name: "selector", type: "bytes4" },
		{ name: "reason", type: "bytes" },
		{ name: "details", type: "bytes" },
	];

	const decoded = decodeParameters(/** @type {any} */ (params), data.slice(4));

	return /** @type {import('./WrappedErrorType.js').WrappedErrorType} */ ({
		target: Address.from(/** @type {any} */ (decoded[0])),
		selector: Selector.from(/** @type {any} */ (decoded[1])),
		reason: /** @type {any} */ (decoded[2]),
		details: /** @type {any} */ (decoded[3]),
	});
}

import * as Hex from "../Hex/index.js";
import { SELECTOR_SIZE } from "./constants.js";
import { getSelector } from "./getSelector.js";

/**
 * Check if CallData matches a specific function selector
 *
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to check
 * @param {string | Uint8Array} selector - Expected selector (hex string or bytes)
 * @returns {boolean} True if selector matches
 *
 * @example
 * ```javascript
 * const calldata = CallData.from("0xa9059cbb...");
 *
 * // Check with hex string
 * CallData.hasSelector(calldata, "0xa9059cbb"); // true
 *
 * // Check with bytes
 * CallData.hasSelector(calldata, new Uint8Array([0xa9, 0x05, 0x9c, 0xbb])); // true
 * ```
 */
export function hasSelector(calldata, selector) {
	const actual = getSelector(calldata);

	// Convert selector to bytes if string
	/** @type {Uint8Array} */
	let expected;
	if (typeof selector === "string") {
		const normalized = selector.startsWith("0x") ? selector : `0x${selector}`;
		expected = Hex.toBytes(normalized);
	} else {
		expected = selector;
	}

	// Must be exactly 4 bytes
	if (expected.length !== SELECTOR_SIZE) {
		return false;
	}

	// Constant-time comparison to prevent timing attacks
	let result = 0;
	for (let i = 0; i < SELECTOR_SIZE; i++) {
		const ai = /** @type {number} */ (actual[i]);
		const ei = /** @type {number} */ (expected[i]);
		result |= ai ^ ei;
	}

	return result === 0;
}

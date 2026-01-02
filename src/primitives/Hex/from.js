import { fromBytes } from "./fromBytes.js";
import { validate } from "./validate.js";

/**
 * Create Hex from string or bytes
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string or bytes
 * @returns {import('./HexType.js').HexType} Hex value
 * @throws {import('./errors.js').InvalidFormatError} If string is missing 0x prefix
 * @throws {import('./errors.js').InvalidCharacterError} If string contains invalid hex characters
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x1234'); // '0x1234'
 * const hex2 = Hex.from(new Uint8Array([0x12, 0x34])); // '0x1234'
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return /** @type {import('./HexType.js').HexType} */ (validate(value));
	}
	return fromBytes(value);
}

import * as OxHex from "ox/Hex";

/**
 * Convert boolean to hex
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {boolean} value - Boolean to convert
 * @returns {import('./BrandedHex.js').Sized<1>} Hex string ('0x01' for true, '0x00' for false)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.fromBoolean(true);  // '0x01'
 * Hex.fromBoolean(false); // '0x00'
 * ```
 */
export function fromBoolean(value) {
	return /** @type {import('./BrandedHex.js').Sized<1>} */ (
		OxHex.padLeft(OxHex.fromBoolean(value), 1)
	);
}

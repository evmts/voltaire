import * as Hex from "../Hex/index.js";

/**
 * Create Selector from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./SelectorType.js').SelectorType} 4-byte selector
 * @throws {Error} If hex is not 4 bytes
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const sel = Selector.fromHex('0xa9059cbb');
 * ```
 */
export function fromHex(hex) {
	const bytes = Hex.toBytes(hex);
	if (bytes.length !== 4) {
		throw new Error(
			`Selector hex must be exactly 4 bytes (8 chars), got ${bytes.length} bytes`,
		);
	}
	return /** @type {import('./SelectorType.js').SelectorType} */ (bytes);
}

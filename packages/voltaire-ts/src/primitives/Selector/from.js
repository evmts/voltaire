import { fromHex } from "./fromHex.js";

/**
 * Create Selector from various input types
 *
 * @param {import('./SelectorType.js').SelectorLike} value - Input value
 * @returns {import('./SelectorType.js').SelectorType} 4-byte selector
 * @throws {Error} If input is invalid
 * @example
 * ```javascript
 * import * as Selector from './primitives/Selector/index.js';
 * const sel = Selector.from('0xa9059cbb');
 * const sel2 = Selector.from(new Uint8Array([0xa9, 0x05, 0x9c, 0xbb]));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}

	if (value instanceof Uint8Array) {
		if (value.length !== 4) {
			throw new Error(`Selector must be exactly 4 bytes, got ${value.length}`);
		}
		return /** @type {import('./SelectorType.js').SelectorType} */ (value);
	}

	throw new Error(`Invalid selector input: ${typeof value}`);
}

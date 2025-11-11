import { fromHex } from "./fromHex.js";

/**
 * Create Bytecode from various input types
 *
 * @see https://voltaire.tevm.sh/primitives/bytecode for Bytecode documentation
 * @since 0.0.0
 * @param {string | Uint8Array} value - Hex string or Uint8Array
 * @returns {import('./BrandedBytecode.js').BrandedBytecode} Bytecode
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bytecode from './primitives/Bytecode/index.js';
 * const code1 = Bytecode.from("0x6001");
 * const code2 = Bytecode.from(new Uint8Array([0x60, 0x01]));
 * ```
 */
export function from(value) {
	if (typeof value === "string") {
		return fromHex(value);
	}
	return /** @type {import('./BrandedBytecode.js').BrandedBytecode} */ (value);
}

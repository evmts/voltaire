import { decode } from "./decode.js";

/**
 * Validates if data is valid RLP encoding
 *
 * @see https://voltaire.tevm.sh/primitives/rlp for RLP documentation
 * @since 0.0.0
 * @param {Uint8Array} data - Data to validate
 * @returns {boolean} True if valid RLP encoding
 * @throws {never}
 * @example
 * ```javascript
 * import * as Rlp from './primitives/Rlp/index.js';
 * const valid = Rlp.validate(new Uint8Array([0x83, 1, 2, 3]));
 * // => true
 *
 * const invalid = Rlp.validate(new Uint8Array([0x83, 1]));
 * // => false (incomplete)
 * ```
 */
export function validate(data) {
	try {
		decode(data);
		return true;
	} catch {
		return false;
	}
}

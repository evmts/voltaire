import { SIZE } from "./constants.js";

/**
 * Create a zero-filled Bytes64
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @returns {import('./Bytes64Type.js').Bytes64Type} Zero-filled Bytes64
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const zeros = Bytes64.zero();
 * ```
 */
export function zero() {
	return /** @type {import('./Bytes64Type.js').Bytes64Type} */ (
		new Uint8Array(SIZE)
	);
}

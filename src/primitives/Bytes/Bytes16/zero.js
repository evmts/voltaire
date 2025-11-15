import { SIZE } from "./constants.js";

/**
 * Create a zero-filled Bytes16
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @returns {import('./Bytes16Type.ts').Bytes16Type} Zero-filled Bytes16
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const zeros = Bytes16.zero();
 * ```
 */
export function zero() {
	return /** @type {import('./Bytes16Type.ts').Bytes16Type} */ (
		new Uint8Array(SIZE)
	);
}

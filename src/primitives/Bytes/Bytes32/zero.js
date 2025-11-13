import { SIZE } from "./constants.js";

/**
 * Create a zero-filled Bytes32
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @returns {import('./BrandedBytes32.ts').BrandedBytes32} Zero-filled Bytes32
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const zeros = Bytes32.zero();
 * ```
 */
export function zero() {
	return /** @type {import('./BrandedBytes32.ts').BrandedBytes32} */ (
		new Uint8Array(SIZE)
	);
}

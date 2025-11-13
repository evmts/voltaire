import { SIZE } from "./constants.js";

/**
 * Create a zero-filled Bytes16
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @returns {import('./BrandedBytes16.ts').BrandedBytes16} Zero-filled Bytes16
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const zeros = Bytes16.zero();
 * ```
 */
export function zero() {
	return /** @type {import('./BrandedBytes16.ts').BrandedBytes16} */ (
		new Uint8Array(SIZE)
	);
}

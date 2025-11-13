/**
 * Clone a Bytes32 value
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} bytes - Value to clone
 * @returns {import('./BrandedBytes32.ts').BrandedBytes32} Cloned value
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const cloned = Bytes32.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes32.ts').BrandedBytes32} */ (
		new Uint8Array(bytes)
	);
}

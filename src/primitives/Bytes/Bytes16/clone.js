/**
 * Clone a Bytes16 value
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} bytes - Value to clone
 * @returns {import('./BrandedBytes16.ts').BrandedBytes16} Cloned value
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const cloned = Bytes16.clone(bytes);
 * ```
 */
export function clone(bytes) {
	return /** @type {import('./BrandedBytes16.ts').BrandedBytes16} */ (
		new Uint8Array(bytes)
	);
}

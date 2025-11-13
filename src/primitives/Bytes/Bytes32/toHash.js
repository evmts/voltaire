/**
 * Convert Bytes32 to Hash (same size, different semantic meaning)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} bytes - Bytes32 to convert
 * @returns {import('../../Hash/BrandedHash/BrandedHash.ts').BrandedHash} Hash
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const hash = Bytes32.toHash(bytes);
 * ```
 */
export function toHash(bytes) {
	return /** @type {import('../../Hash/BrandedHash/BrandedHash.ts').BrandedHash} */ (
		new Uint8Array(bytes)
	);
}

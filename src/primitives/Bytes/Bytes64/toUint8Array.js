/**
 * Convert Bytes64 to Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes64 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes64.ts').BrandedBytes64} bytes - Bytes64 to convert
 * @returns {Uint8Array} Raw bytes
 * @example
 * ```javascript
 * import * as Bytes64 from './primitives/Bytes/Bytes64/index.js';
 * const raw = Bytes64.toUint8Array(bytes);
 * ```
 */
export function toUint8Array(bytes) {
	return new Uint8Array(bytes);
}

/**
 * Convert Bytes16 to Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes16 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes16.ts').BrandedBytes16} bytes - Bytes16 to convert
 * @returns {Uint8Array} Raw bytes
 * @example
 * ```javascript
 * import * as Bytes16 from './primitives/Bytes/Bytes16/index.js';
 * const raw = Bytes16.toUint8Array(bytes);
 * ```
 */
export function toUint8Array(bytes) {
	return new Uint8Array(bytes);
}

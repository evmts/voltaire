/**
 * Convert Bytes32 to Uint8Array
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} bytes - Bytes32 to convert
 * @returns {Uint8Array} Raw bytes
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const raw = Bytes32.toUint8Array(bytes);
 * ```
 */
export function toUint8Array(bytes) {
	return new Uint8Array(bytes);
}

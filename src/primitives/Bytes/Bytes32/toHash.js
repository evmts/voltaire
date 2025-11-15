/**
 * Convert Bytes32 to Hash (same size, different semantic meaning)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./Bytes32Type.ts').Bytes32Type} bytes - Bytes32 to convert
 * @returns {import('../../Hash/HashType/HashType.ts').HashType} Hash
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const hash = Bytes32.toHash(bytes);
 * ```
 */
export function toHash(bytes) {
	return /** @type {import('../../Hash/HashType/HashType.ts').HashType} */ (
		new Uint8Array(bytes)
	);
}

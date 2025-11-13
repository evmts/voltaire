/**
 * Extract Address from Bytes32 (last 20 bytes)
 *
 * @see https://voltaire.tevm.sh/primitives/bytes/bytes32 for documentation
 * @since 0.0.0
 * @param {import('./BrandedBytes32.ts').BrandedBytes32} bytes - Bytes32 to extract from
 * @returns {import('../../Address/BrandedAddress/index.ts').BrandedAddress} Address
 * @example
 * ```javascript
 * import * as Bytes32 from './primitives/Bytes/Bytes32/index.js';
 * const addr = Bytes32.toAddress(bytes);
 * ```
 */
export function toAddress(bytes) {
	return /** @type {import('../../Address/BrandedAddress/index.ts').BrandedAddress} */ (
		bytes.slice(-20)
	);
}

// @ts-nocheck
/**
 * Convert signature to bytes with v appended (65 bytes: r || s || v)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../BrandedSignature.js').BrandedSignature} signature - ECDSA signature
 * @returns {Uint8Array} 65-byte signature
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const bytes = Secp256k1.Signature.toBytes(signature);
 * console.log(bytes.length); // 65
 * ```
 */
export function toBytes(signature) {
	const result = new Uint8Array(65);
	result.set(signature.r, 0);
	result.set(signature.s, 32);
	result[64] = signature.v;
	return result;
}

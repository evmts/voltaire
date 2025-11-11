// @ts-nocheck
/**
 * Concatenate multiple Uint8Arrays
 * @param {...Uint8Array} arrays
 * @returns {Uint8Array}
 */
function concat(...arrays) {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

/**
 * Convert signature to compact format (64 bytes: r || s)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../BrandedSignature.js').BrandedSignature} signature - ECDSA signature
 * @returns {Uint8Array} 64-byte compact signature
 * @throws {never}
 * @example
 * ```javascript
 * import { Secp256k1 } from './crypto/Secp256k1/index.js';
 * const compact = Secp256k1.Signature.toCompact(signature);
 * console.log(compact.length); // 64
 * ```
 */
export function toCompact(signature) {
	return concat(signature.r, signature.s);
}

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
 * @param {import('../BrandedSignature.js').BrandedSignature} signature - ECDSA signature
 * @returns {Uint8Array} 64-byte compact signature
 *
 * @example
 * ```typescript
 * const compact = Signature.toCompact(signature);
 * console.log(compact.length); // 64
 * ```
 */
export function toCompact(signature) {
	return concat(signature.r, signature.s);
}

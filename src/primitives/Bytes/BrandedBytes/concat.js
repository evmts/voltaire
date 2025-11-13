/**
 * Concatenate multiple Bytes
 *
 * @param {...import('./BrandedBytes.js').BrandedBytes} arrays - Bytes to concatenate
 * @returns {import('./BrandedBytes.js').BrandedBytes} Concatenated Bytes
 *
 * @example
 * ```typescript
 * const result = Bytes.concat(bytes1, bytes2, bytes3);
 * ```
 */
export function concat(...arrays) {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return /** @type {import('./BrandedBytes.js').BrandedBytes} */ (result);
}

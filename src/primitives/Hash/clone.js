/**
 * Clone hash
 *
 * @param {import('./BrandedHash.js').BrandedHash} hash - Hash to clone
 * @returns {import('./BrandedHash.js').BrandedHash} New hash with same value
 *
 * @example
 * ```js
 * const hash = Hash('0x1234...');
 * const copy = Hash.clone(hash);
 * const copy2 = hash.clone(); // Same result
 * ```
 */
export function clone(hash) {
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
		new Uint8Array(hash)
	);
}

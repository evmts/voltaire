/**
 * Create a copy of a hash
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to clone
 * @returns {import('./BrandedHash.ts').BrandedHash} Copy of hash
 *
 * @example
 * ```js
 * const hash = Hash.from('0x1234...');
 * const copy = Hash.clone(hash);
 * ```
 */
export function clone(hash) {
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
		new Uint8Array(hash)
	);
}

/**
 * Convert Hash to Uint8Array
 *
 * @param {import('./BrandedHash.ts').BrandedHash} hash - Hash to convert
 * @returns {Uint8Array} Copy of hash bytes
 *
 * @example
 * ```js
 * const hash = Hash.from('0x1234...');
 * const bytes = Hash.toBytes(hash);
 * ```
 */
export function toBytes(hash) {
	// Return copy to prevent external mutations
	return new Uint8Array(hash);
}

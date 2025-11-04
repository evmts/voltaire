import { SIZE } from "./BrandedHash.js";

/**
 * Create Hash from raw bytes
 *
 * @param {Uint8Array} bytes - Raw bytes (must be 32 bytes)
 * @returns {import('./BrandedHash.js').BrandedHash} Hash bytes
 * @throws {Error} If bytes is wrong length
 *
 * @example
 * ```js
 * const hash = Hash.fromBytes(new Uint8Array(32));
 * ```
 */
export function fromBytes(bytes) {
	if (bytes.length !== SIZE) {
		throw new Error(`Hash must be ${SIZE} bytes, got ${bytes.length}`);
	}
	return /** @type {import('./BrandedHash.ts').BrandedHash} */ (
		new Uint8Array(bytes)
	);
}

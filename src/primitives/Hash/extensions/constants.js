/**
 * Hash size in bytes (32 bytes = 256 bits)
 */
export const SIZE = 32;

/**
 * Zero hash constant (32 zero bytes)
 * @type {import('./../BrandedHash.js').BrandedHash}
 */
export const ZERO = /** @type {import('./../BrandedHash.js').BrandedHash} */ (
	new Uint8Array(SIZE)
);

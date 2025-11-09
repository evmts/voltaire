/**
 * Hash size in bytes (32 bytes = 256 bits)
 */
export const SIZE = 32;

/**
 * Zero hash constant (32 zero bytes)
 * @type {import('./BrandedHash.ts').BrandedHash}
 */
export const ZERO = /** @type {import('./BrandedHash.ts').BrandedHash} */ (
	new Uint8Array(SIZE)
);

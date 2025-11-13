/**
 * Bytes64 size in bytes (64 bytes = 512 bits)
 */
export const SIZE = 64;

/**
 * Zero Bytes64 constant (64 zero bytes)
 * @type {import('./BrandedBytes64.ts').BrandedBytes64}
 */
export const ZERO = /** @type {import('./BrandedBytes64.ts').BrandedBytes64} */ (
	new Uint8Array(SIZE)
);

/**
 * @typedef {import('./BrandedBytes64.ts').BrandedBytes64} BrandedBytes64
 */

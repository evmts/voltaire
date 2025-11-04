/**
 * Brand symbol for type safety
 */
export const hashSymbol = Symbol("Hash");

/**
 * Hash size in bytes (32 bytes = 256 bits)
 */
export const SIZE = 32;

/**
 * Zero hash constant (32 zero bytes)
 * @type {import('./BrandedHash.ts').BrandedHash}
 */
export const ZERO = new Uint8Array(SIZE);

/**
 * @typedef {import('./BrandedHash.ts').BrandedHash} BrandedHash
 */

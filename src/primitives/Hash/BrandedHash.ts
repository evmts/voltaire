/**
 * Brand symbol for type safety
 */
export const hashSymbol = Symbol("Hash");

/**
 * Branded Hash type: 32-byte hash value
 */
export type BrandedHash = Uint8Array & { __brand: typeof hashSymbol };

/**
 * Hash size in bytes (32 bytes = 256 bits)
 */
export const SIZE = 32;

/**
 * Zero hash constant (32 zero bytes)
 */
export const ZERO = new Uint8Array(SIZE) as BrandedHash;

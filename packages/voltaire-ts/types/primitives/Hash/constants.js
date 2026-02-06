/**
 * Hash size in bytes (32 bytes = 256 bits)
 */
export const SIZE = 32;
/**
 * Zero hash constant (32 zero bytes)
 * @type {import('./HashType.js').HashType}
 */
export const ZERO = /** @type {import('./HashType.js').HashType} */ (new Uint8Array(SIZE));

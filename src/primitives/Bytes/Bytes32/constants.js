/**
 * Bytes32 size in bytes (32 bytes = 256 bits)
 * CRITICAL: Most common fixed-size type in Ethereum
 * Used for: storage slots, hashes, merkle nodes
 */
export const SIZE = 32;

/**
 * Zero Bytes32 constant (32 zero bytes)
 * @type {import('./BrandedBytes32.ts').BrandedBytes32}
 */
export const ZERO = new Uint8Array(SIZE);

/**
 * @typedef {import('./BrandedBytes32.ts').BrandedBytes32} BrandedBytes32
 */

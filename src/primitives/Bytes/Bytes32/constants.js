/**
 * Bytes32 size in bytes (32 bytes = 256 bits)
 * CRITICAL: Most common fixed-size type in Ethereum
 * Used for: storage slots, hashes, merkle nodes
 */
export const SIZE = 32;

/**
 * Zero Bytes32 constant (32 zero bytes)
 * @type {import('./Bytes32Type.js').Bytes32Type}
 */
export const ZERO = /** @type {import('./Bytes32Type.js').Bytes32Type} */ (
	new Uint8Array(SIZE)
);

/**
 * @typedef {import('./Bytes32Type.js').Bytes32Type} Bytes32Type
 */

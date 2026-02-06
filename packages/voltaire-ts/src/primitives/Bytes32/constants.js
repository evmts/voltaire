/**
 * Bytes32 constants
 * @module
 */

/** Size of Bytes32 in bytes */
export const SIZE = 32;

/** Zero constant - 32 bytes of zeros */
export const ZERO = /** @type {import('./Bytes32Type.js').Bytes32Type} */ (
	new Uint8Array(SIZE)
);

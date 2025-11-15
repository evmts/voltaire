/**
 * Bytes64 size in bytes (64 bytes = 512 bits)
 */
export const SIZE = 64;

/**
 * Zero Bytes64 constant (64 zero bytes)
 * @type {import('./Bytes64Type.ts').Bytes64Type}
 */
export const ZERO = /** @type {import('./Bytes64Type.ts').Bytes64Type} */ (
	new Uint8Array(SIZE)
);

/**
 * @typedef {import('./Bytes64Type.ts').Bytes64Type} Bytes64Type
 */

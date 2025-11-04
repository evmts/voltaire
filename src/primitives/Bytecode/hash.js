import { Keccak256 } from "../../crypto/Keccak256/index.js";

/**
 * Compute bytecode hash (keccak256)
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode to hash
 * @returns {import('../Hash/BrandedHash.js').BrandedHash} Bytecode hash (32 bytes)
 *
 * @example
 * ```typescript
 * const code = new Uint8Array([0x60, 0x01]);
 * const codeHash = Bytecode.hash(code);
 * ```
 */
export function hash(code) {
	return Keccak256.hash(code);
}

/**
 * Factory: Compute bytecode hash (keccak256)
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(code: import('./BrandedBytecode.js').BrandedBytecode) => import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} Function that computes bytecode hash
 */
export function Hash({ keccak256 }) {
	/**
	 * Compute bytecode hash (keccak256)
	 *
	 * @param {import('./BrandedBytecode.js').BrandedBytecode} code - Bytecode to hash
	 * @returns {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} Bytecode hash (32 bytes)
	 *
	 * @example
	 * ```typescript
	 * const code = new Uint8Array([0x60, 0x01]);
	 * const codeHash = hash(code);
	 * ```
	 */
	return function hash(code) {
		// @ts-expect-error - keccak256 returns Uint8Array, branded as Hash by return type
		return keccak256(code);
	};
}

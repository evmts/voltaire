/**
 * Factory: Compute bytecode hash (keccak256)
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(code: import('./BytecodeType.js').BrandedBytecode) => any} Function that computes bytecode hash
 */
export function Hash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (code: import("./BytecodeType.js").BrandedBytecode) => any;
//# sourceMappingURL=hash.d.ts.map
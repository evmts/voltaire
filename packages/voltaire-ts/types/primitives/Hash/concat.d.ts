/**
 * Factory: Concatenate multiple hashes and hash the result
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(...hashes: import('./HashType.js').HashType[]) => import('./HashType.js').HashType} Function that concatenates and hashes
 */
export function Concat({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (...hashes: import("./HashType.js").HashType[]) => import("./HashType.js").HashType;
//# sourceMappingURL=concat.d.ts.map
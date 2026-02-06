/**
 * Factory: Create ENS namehash function with explicit crypto dependency
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(name: import('./EnsType.js').EnsType) => Uint8Array} Function that computes ENS namehash
 */
export function Namehash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (name: import("./EnsType.js").EnsType) => Uint8Array;
//# sourceMappingURL=namehash.d.ts.map
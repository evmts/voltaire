/**
 * Factory: Create ENS labelhash function with explicit crypto dependency
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(label: import('./EnsType.js').EnsType) => Uint8Array} Function that computes ENS labelhash
 */
export function Labelhash({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (label: import("./EnsType.js").EnsType) => Uint8Array;
//# sourceMappingURL=labelhash.d.ts.map
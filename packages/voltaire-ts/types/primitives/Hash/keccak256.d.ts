/**
 * Factory: Hash data with Keccak-256
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(data: Uint8Array) => import('./HashType.js').HashType} Function that hashes data
 */
export function Keccak256({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (data: Uint8Array) => import("./HashType.js").HashType;
//# sourceMappingURL=keccak256.d.ts.map
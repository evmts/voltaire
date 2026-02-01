/**
 * Factory: Hash hex string with Keccak-256
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(hex: string) => import('./HashType.js').HashType} Function that hashes hex strings
 */
export function Keccak256Hex({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (hex: string) => import("./HashType.js").HashType;
//# sourceMappingURL=keccak256Hex.d.ts.map
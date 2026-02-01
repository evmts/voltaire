/**
 * Factory: Hash string with Keccak-256
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @returns {(str: string) => import('./HashType.js').HashType} Function that hashes strings
 */
export function Keccak256String({ keccak256 }: {
    keccak256: (data: Uint8Array) => Uint8Array;
}): (str: string) => import("./HashType.js").HashType;
//# sourceMappingURL=keccak256String.d.ts.map
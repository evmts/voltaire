/**
 * Factory: Create unified signature verification for EOA and contract accounts
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(provider: {request: (method: string, params: unknown[]) => Promise<unknown>}, address: import("../Address/AddressType.js").AddressType | string, hash: import("../Hash/HashType.js").HashType | Uint8Array, signature: {r: Uint8Array, s: Uint8Array, v: number} | Uint8Array) => Promise<boolean>}
 */
export function VerifySignature({ keccak256, recoverPublicKey, addressFromPublicKey, }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    recoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, messageHash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType;
}): (provider: {
    request: (method: string, params: unknown[]) => Promise<unknown>;
}, address: import("../Address/AddressType.js").AddressType | string, hash: import("../Hash/HashType.js").HashType | Uint8Array, signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
} | Uint8Array) => Promise<boolean>;
/**
 * Error thrown when signature format is invalid (not a verification failure)
 */
export class InvalidSignatureFormatError extends Error {
    /**
     * @param {string} message
     */
    constructor(message: string);
}
//# sourceMappingURL=verifySignature.d.ts.map
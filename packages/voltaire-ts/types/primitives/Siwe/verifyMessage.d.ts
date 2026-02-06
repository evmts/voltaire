/**
 * Factory: Verify both message validity and signature
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, hash: Uint8Array) => Uint8Array} deps.secp256k1RecoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => Uint8Array} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(message: import('./SiweMessageType.js').SiweMessageType, signature: import('./SiweMessageType.js').Signature, options?: {now?: Date}) => import('./SiweMessageType.js').ValidationResult} Function that verifies message and signature
 */
export function VerifyMessage({ keccak256, secp256k1RecoverPublicKey, addressFromPublicKey, }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    secp256k1RecoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, hash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => Uint8Array;
}): (message: import("./SiweMessageType.js").SiweMessageType, signature: import("./SiweMessageType.js").Signature, options?: {
    now?: Date;
}) => import("./SiweMessageType.js").ValidationResult;
//# sourceMappingURL=verifyMessage.d.ts.map
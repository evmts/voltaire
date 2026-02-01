/**
 * Factory: Create signature verification function for EIP-191 personal messages
 *
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(message: Uint8Array | string, signature: {r: Uint8Array, s: Uint8Array, v: number}, expectedAddress: import("../Address/AddressType.js").AddressType) => boolean}
 */
export function Verify({ keccak256, recoverPublicKey, addressFromPublicKey }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    recoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, messageHash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType;
}): (message: Uint8Array | string, signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, expectedAddress: import("../Address/AddressType.js").AddressType) => boolean;
//# sourceMappingURL=verify.d.ts.map
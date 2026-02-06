/**
 * Factory: Verify authorization signature and recover authority
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(auth: import("./AuthorizationType.js").AuthorizationType) => import("../Address/AddressType.js").AddressType} Function that verifies authorization
 */
export function Verify({ keccak256, rlpEncode, recoverPublicKey, addressFromPublicKey, }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Array<Uint8Array>) => Uint8Array;
    recoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, messageHash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType;
}): (auth: import("./AuthorizationType.js").AuthorizationType) => import("../Address/AddressType.js").AddressType;
//# sourceMappingURL=verify.d.ts.map
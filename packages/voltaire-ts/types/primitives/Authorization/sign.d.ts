/**
 * Factory: Create signed authorization from unsigned
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(messageHash: Uint8Array, privateKey: Uint8Array) => {r: Uint8Array, s: Uint8Array, v: number}} deps.sign - secp256k1 sign function
 * @param {(signature: {r: Uint8Array, s: Uint8Array, v: number}, messageHash: Uint8Array) => Uint8Array} deps.recoverPublicKey - secp256k1 public key recovery
 * @param {(x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType} deps.addressFromPublicKey - Address derivation from public key
 * @returns {(unsigned: {chainId: bigint, address: import("../Address/AddressType.js").AddressType, nonce: bigint}, privateKey: Uint8Array) => import("./AuthorizationType.js").AuthorizationType} Function that signs authorization
 */
export function Sign({ keccak256, rlpEncode, sign: secp256k1Sign, recoverPublicKey, addressFromPublicKey, }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Array<Uint8Array>) => Uint8Array;
    sign: (messageHash: Uint8Array, privateKey: Uint8Array) => {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    };
    recoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, messageHash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => import("../Address/AddressType.js").AddressType;
}): (unsigned: {
    chainId: bigint;
    address: import("../Address/AddressType.js").AddressType;
    nonce: bigint;
}, privateKey: Uint8Array) => import("./AuthorizationType.js").AuthorizationType;
//# sourceMappingURL=sign.d.ts.map
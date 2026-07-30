/**
 * Factory: Create signed authorization from unsigned
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(data: Array<Uint8Array>) => Uint8Array} deps.rlpEncode - RLP encode function
 * @param {(messageHash: Uint8Array, privateKey: Uint8Array) => {r: Uint8Array, s: Uint8Array, v: number, yParity?: number}} deps.sign - secp256k1 sign function
 * @returns {(unsigned: {chainId: bigint, address: import("../Address/AddressType.js").AddressType, nonce: bigint}, privateKey: Uint8Array) => import("./AuthorizationType.js").AuthorizationType} Function that signs authorization
 */
export function Sign({ keccak256, rlpEncode, sign: secp256k1Sign }: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Array<Uint8Array>) => Uint8Array;
    sign: (messageHash: Uint8Array, privateKey: Uint8Array) => {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
        yParity?: number;
    };
}): (unsigned: {
    chainId: bigint;
    address: import("../Address/AddressType.js").AddressType;
    nonce: bigint;
}, privateKey: Uint8Array) => import("./AuthorizationType.js").AuthorizationType;
//# sourceMappingURL=sign.d.ts.map
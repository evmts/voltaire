/**
 * Factory: Sign a message hash with private key
 * @param {Object} deps - Crypto dependencies
 * @param {(messageHash: import('../Hash/HashType.js').HashType, privateKey: import('./PrivateKeyType.js').PrivateKeyType) => import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType} deps.secp256k1Sign - Secp256k1 signing function
 * @returns {(privateKey: import('./PrivateKeyType.js').PrivateKeyType, hash: import('../Hash/HashType.js').HashType) => import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType} Function that creates ECDSA signature
 */
export function Sign({ secp256k1Sign }: {
    secp256k1Sign: (messageHash: import("../Hash/HashType.js").HashType, privateKey: import("./PrivateKeyType.js").PrivateKeyType) => import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType;
}): (privateKey: import("./PrivateKeyType.js").PrivateKeyType, hash: import("../Hash/HashType.js").HashType) => import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType;
//# sourceMappingURL=sign.d.ts.map
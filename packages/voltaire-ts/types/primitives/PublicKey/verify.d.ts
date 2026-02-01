/**
 * Factory: Verify signature against public key
 * @param {Object} deps - Crypto dependencies
 * @param {(signature: import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType, hash: import('../Hash/BrandedHash.js').BrandedHash, publicKey: import('../../crypto/Secp256k1/Secp256k1PublicKeyType.js').Secp256k1PublicKeyType) => boolean} deps.secp256k1Verify - Secp256k1 signature verification function (expects 64-byte public key)
 * @returns {(publicKey: import('./PublicKeyType.js').PublicKeyType, hash: import('../Hash/BrandedHash.js').BrandedHash, signature: import('../../crypto/Secp256k1/SignatureType.js').Secp256k1SignatureType) => boolean} Function that verifies ECDSA signature
 */
export function Verify({ secp256k1Verify }: {
    secp256k1Verify: (signature: import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType, hash: import("../Hash/BrandedHash.js").BrandedHash, publicKey: import("../../crypto/Secp256k1/Secp256k1PublicKeyType.js").Secp256k1PublicKeyType) => boolean;
}): (publicKey: import("./PublicKeyType.js").PublicKeyType, hash: import("../Hash/BrandedHash.js").BrandedHash, signature: import("../../crypto/Secp256k1/SignatureType.js").Secp256k1SignatureType) => boolean;
//# sourceMappingURL=verify.d.ts.map
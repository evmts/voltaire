// @ts-nocheck
/**
 * BLS12-381 Signature Verification
 *
 * Verify BLS signatures using pairings.
 * Uses "short signatures" scheme (Ethereum consensus).
 *
 * @see https://voltaire.tevm.sh/crypto/bls12-381 for BLS12-381 documentation
 * @since 0.0.0
 */
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { SignatureError } from "./errors.js";
// Ethereum consensus uses "short signatures" scheme
const bls = bls12_381.shortSignatures;
/**
 * Verify a BLS12-381 signature
 *
 * Uses pairing check for verification.
 *
 * @param {Uint8Array} signature - Compressed G1 signature (48 bytes)
 * @param {Uint8Array} message - Original message that was signed
 * @param {Uint8Array} publicKey - Compressed G2 public key (96 bytes)
 * @returns {boolean} True if signature is valid
 * @throws {SignatureError} If verification fails due to invalid inputs
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * const message = new TextEncoder().encode('Hello!');
 * const signature = Bls12381.sign(message, privateKey);
 *
 * const isValid = Bls12381.verify(signature, message, publicKey);
 * console.log(isValid); // true
 * ```
 */
export function verify(signature, message, publicKey) {
    // Validate inputs
    if (!(signature instanceof Uint8Array)) {
        throw new SignatureError("Signature must be Uint8Array");
    }
    if (!(message instanceof Uint8Array)) {
        throw new SignatureError("Message must be Uint8Array");
    }
    if (!(publicKey instanceof Uint8Array)) {
        throw new SignatureError("Public key must be Uint8Array");
    }
    try {
        // Hash message to G1 curve point
        const msgPoint = bls.hash(message);
        // Deserialize signature from bytes (G1 point)
        const sig = bls.Signature.fromBytes(signature);
        // Deserialize public key from bytes (G2 point)
        const pk = bls12_381.G2.Point.fromBytes(publicKey);
        // Verify
        return bls.verify(sig, msgPoint, pk);
    }
    catch (_error) {
        // Invalid signature format or point not on curve
        return false;
    }
}
/**
 * Verify a BLS signature with pre-computed points (advanced)
 *
 * For use when you have already deserialized the points.
 *
 * @param {import('./G2PointType.js').G2PointType} signaturePoint - Signature as G2 point
 * @param {import('./G2PointType.js').G2PointType} messagePoint - Message hash as G2 point
 * @param {import('./G1PointType.js').G1PointType} publicKeyPoint - Public key as G1 point
 * @returns {boolean} True if signature is valid
 */
export function verifyPoint(signaturePoint, messagePoint, publicKeyPoint) {
    try {
        // Convert our types to noble's format
        const sig = bls12_381.G2.Point.fromAffine({
            x: { c0: signaturePoint.x.c0, c1: signaturePoint.x.c1 },
            y: { c0: signaturePoint.y.c0, c1: signaturePoint.y.c1 },
        });
        const msg = bls12_381.G2.Point.fromAffine({
            x: { c0: messagePoint.x.c0, c1: messagePoint.x.c1 },
            y: { c0: messagePoint.y.c0, c1: messagePoint.y.c1 },
        });
        const pk = bls12_381.G1.Point.fromAffine({
            x: publicKeyPoint.x,
            y: publicKeyPoint.y,
        });
        const g1 = bls12_381.G1.Point.BASE;
        // Pairing check: e(pk, msg) == e(g1, sig)
        // Equivalent to: e(pk, msg) * e(-g1, sig) == 1
        const lhs = bls12_381.pairing(pk, msg);
        const rhs = bls12_381.pairing(g1, sig);
        // Compare pairing results
        return bls12_381.Fp12.eql(lhs, rhs);
    }
    catch (_error) {
        return false;
    }
}

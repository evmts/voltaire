// @ts-nocheck
/**
 * BLS12-381 Signature
 *
 * Sign a message using BLS12-381 signatures (Ethereum consensus layer).
 * Uses "short signatures" scheme where signatures are G1 points (48 bytes)
 * and public keys are G2 points (96 bytes).
 *
 * @see https://voltaire.tevm.sh/crypto/bls12-381 for BLS12-381 documentation
 * @see https://eips.ethereum.org/EIPS/eip-2333 for BLS key derivation
 * @since 0.0.0
 */
import { bls12_381 } from "@noble/curves/bls12-381.js";
import { FR_MOD } from "./constants.js";
import { InvalidScalarError, SignatureError } from "./errors.js";
// Ethereum consensus uses "short signatures" scheme
// Signatures are G1 points (48 bytes compressed)
// Public keys are G2 points (96 bytes compressed)
const bls = bls12_381.shortSignatures;
/**
 * Sign a message using BLS12-381
 *
 * Uses the Ethereum consensus "short signatures" scheme:
 * - Signature = privateKey * H(message) where H maps to G1
 * - Signatures are 48 bytes (compressed G1 point)
 *
 * @param {Uint8Array} message - Message to sign
 * @param {Uint8Array} privateKey - 32-byte private key (scalar in Fr)
 * @returns {Uint8Array} Signature as compressed G1 point (48 bytes)
 * @throws {InvalidScalarError} If private key is invalid
 * @throws {SignatureError} If signing fails
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const message = new TextEncoder().encode('Hello, Ethereum!');
 * const signature = Bls12381.sign(message, privateKey);
 * ```
 */
export function sign(message, privateKey) {
    // Validate private key
    if (!(privateKey instanceof Uint8Array)) {
        throw new InvalidScalarError("Private key must be Uint8Array");
    }
    if (privateKey.length !== 32) {
        throw new InvalidScalarError("Private key must be 32 bytes");
    }
    // Check if private key is zero
    const isZero = privateKey.every((byte) => byte === 0);
    if (isZero) {
        throw new InvalidScalarError("Private key cannot be zero");
    }
    // Convert to scalar and validate it's in range
    let scalar = 0n;
    for (let i = 0; i < 32; i++) {
        scalar = (scalar << 8n) | BigInt(privateKey[i]);
    }
    if (scalar >= FR_MOD) {
        throw new InvalidScalarError("Private key must be less than curve order");
    }
    try {
        // Hash message to G1 curve point first
        const msgPoint = bls.hash(message);
        // Sign the hashed message point
        const sig = bls.sign(msgPoint, privateKey);
        // Return compressed bytes
        return sig.toBytes();
    }
    catch (error) {
        throw new SignatureError(`Signing failed: ${error.message}`);
    }
}
/**
 * Sign a pre-hashed message (G2 point) using BLS12-381
 *
 * For advanced use when you have already hashed the message to G2.
 *
 * @param {import('./G2PointType.js').G2PointType} messagePoint - Message as G2 point
 * @param {Uint8Array} privateKey - 32-byte private key (scalar in Fr)
 * @returns {import('./G2PointType.js').G2PointType} Signature as G2 point (projective)
 * @throws {InvalidScalarError} If private key is invalid
 * @throws {SignatureError} If signing fails
 */
export function signPoint(messagePoint, privateKey) {
    // Validate private key
    if (!(privateKey instanceof Uint8Array)) {
        throw new InvalidScalarError("Private key must be Uint8Array");
    }
    if (privateKey.length !== 32) {
        throw new InvalidScalarError("Private key must be 32 bytes");
    }
    // Convert to scalar
    let scalar = 0n;
    for (let i = 0; i < 32; i++) {
        scalar = (scalar << 8n) | BigInt(privateKey[i]);
    }
    if (scalar === 0n || scalar >= FR_MOD) {
        throw new InvalidScalarError("Invalid private key scalar");
    }
    try {
        // Convert our G2PointType to noble's format and multiply
        const noblePoint = bls12_381.G2.Point.fromAffine({
            x: { c0: messagePoint.x.c0, c1: messagePoint.x.c1 },
            y: { c0: messagePoint.y.c0, c1: messagePoint.y.c1 },
        });
        const sigPoint = noblePoint.multiply(scalar);
        const affine = sigPoint.toAffine();
        return {
            x: { c0: affine.x.c0, c1: affine.x.c1 },
            y: { c0: affine.y.c0, c1: affine.y.c1 },
            z: { c0: 1n, c1: 0n },
        };
    }
    catch (error) {
        throw new SignatureError(`Signing failed: ${error.message}`);
    }
}

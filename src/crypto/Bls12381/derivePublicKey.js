// @ts-nocheck
/**
 * BLS12-381 Public Key Derivation
 *
 * Derive public key from private key for BLS signatures.
 * Uses "short signatures" scheme (Ethereum consensus) where
 * public keys are G2 points (96 bytes compressed).
 *
 * @see https://voltaire.tevm.sh/crypto/bls12-381 for BLS12-381 documentation
 * @since 0.0.0
 */

import { bls12_381 } from "@noble/curves/bls12-381.js";
import { InvalidScalarError } from "./errors.js";
import { FR_MOD } from "./constants.js";

// Ethereum consensus uses "short signatures" scheme
// Public keys are G2 points (96 bytes compressed)
const bls = bls12_381.shortSignatures;

/**
 * Derive a BLS12-381 public key from a private key
 *
 * Public key = privateKey * G2_generator
 *
 * @param {Uint8Array} privateKey - 32-byte private key (scalar in Fr)
 * @returns {Uint8Array} Compressed G2 public key (96 bytes)
 * @throws {InvalidScalarError} If private key is invalid
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * console.log(publicKey.length); // 96
 * ```
 */
export function derivePublicKey(privateKey) {
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

	// Convert to scalar and validate range
	let scalar = 0n;
	for (let i = 0; i < 32; i++) {
		scalar = (scalar << 8n) | BigInt(privateKey[i]);
	}
	if (scalar >= FR_MOD) {
		throw new InvalidScalarError("Private key must be less than curve order");
	}

	try {
		const pk = bls.getPublicKey(privateKey);
		// Return compressed G2 bytes
		return pk.toBytes();
	} catch (error) {
		throw new InvalidScalarError(`Failed to derive public key: ${error.message}`);
	}
}

/**
 * Derive a BLS12-381 public key as a G1 point (uncompressed)
 *
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {import('./G1PointType.js').G1PointType} Public key as G1 point
 * @throws {InvalidScalarError} If private key is invalid
 */
export function derivePublicKeyPoint(privateKey) {
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
		const point = bls12_381.G1.Point.BASE.multiply(scalar);
		const affine = point.toAffine();

		return {
			x: affine.x,
			y: affine.y,
			z: 1n,
		};
	} catch (error) {
		throw new InvalidScalarError(`Failed to derive public key: ${error.message}`);
	}
}

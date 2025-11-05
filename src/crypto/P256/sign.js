// @ts-nocheck
import { p256 } from "@noble/curves/nist.js";
import { PRIVATE_KEY_SIZE } from "./constants.js";
import { InvalidPrivateKeyError, P256Error } from "./errors.js";

/**
 * Sign a message hash with a private key
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation.
 *
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash to sign
 * @param {import('./BrandedP256PrivateKey.js').BrandedP256PrivateKey} privateKey - 32-byte private key
 * @returns {import('./BrandedP256Signature.js').BrandedP256Signature} ECDSA signature with r, s components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {P256Error} If signing fails
 *
 * @example
 * ```typescript
 * const messageHash = Hash.keccak256String('Hello!');
 * const privateKey = new Uint8Array(32); // Your key
 * const signature = P256.sign(messageHash, privateKey);
 * ```
 */
export function sign(messageHash, privateKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}

	try {
		const sig = p256.sign(messageHash, privateKey);
		return {
			r: sig.slice(0, 32),
			s: sig.slice(32, 64),
		};
	} catch (error) {
		throw new P256Error(`Signing failed: ${error}`);
	}
}

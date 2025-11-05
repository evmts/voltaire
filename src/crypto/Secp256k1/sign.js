// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { PRIVATE_KEY_SIZE } from "./constants.js";
import { InvalidPrivateKeyError, Secp256k1Error } from "./errors.js";

/**
 * Sign a message hash with a private key
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation.
 * Returns signature with Ethereum-compatible v value (27 or 28).
 *
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash to sign
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {import('./BrandedSignature.js').BrandedSignature} ECDSA signature with r, s, v components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {Secp256k1Error} If signing fails
 *
 * @example
 * ```typescript
 * const messageHash = Hash.keccak256String('Hello!');
 * const privateKey = new Uint8Array(32); // Your key
 * const signature = Secp256k1.sign(messageHash, privateKey);
 * console.log(signature.v); // 27 or 28
 * ```
 */
export function sign(messageHash, privateKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidPrivateKeyError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}

	try {
		// Sign with compact format (prehash:false since we already have the hash)
		const sigCompact = secp256k1.sign(messageHash, privateKey, {
			prehash: false,
		});

		// Extract r and s
		const r = sigCompact.slice(0, 32);
		const s = sigCompact.slice(32, 64);

		// Compute recovery bit by trying all possibilities (0-3)
		// In practice, only 0-1 are typically needed for secp256k1
		const publicKey = secp256k1.getPublicKey(privateKey, false);
		const sig = secp256k1.Signature.fromBytes(sigCompact);

		let recoveryBit = 0;
		for (let i = 0; i < 4; i++) {
			try {
				const sigWithRecovery = sig.addRecoveryBit(i);
				const recovered = sigWithRecovery.recoverPublicKey(messageHash);
				const uncompressed = recovered.toBytes(false);

				if (uncompressed.every((byte, idx) => byte === publicKey[idx])) {
					recoveryBit = i;
					break;
				}
			} catch {
				// This recovery bit doesn't work, try next
			}
		}

		// Convert recovery bit to Ethereum v (27 or 28)
		const v = 27 + recoveryBit;

		return { r, s, v };
	} catch (error) {
		throw new Secp256k1Error(`Signing failed: ${error}`);
	}
}

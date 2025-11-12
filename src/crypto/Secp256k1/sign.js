// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import {
	CryptoError,
	InvalidPrivateKeyError,
} from "../../primitives/errors/index.js";

/**
 * Sign a message hash with a private key
 *
 * Uses deterministic ECDSA (RFC 6979) for signature generation.
 * Returns signature with Ethereum-compatible v value (27 or 28).
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash to sign
 * @param {import('../../primitives/PrivateKey/BrandedPrivateKey/BrandedPrivateKey.js').BrandedPrivateKey} privateKey - 32-byte private key
 * @returns {import('./BrandedSignature.js').BrandedSignature} ECDSA signature with r, s, v components
 * @throws {InvalidPrivateKeyError} If private key is invalid
 * @throws {CryptoError} If signing fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * import * as PrivateKey from './primitives/PrivateKey/index.js';
 * const messageHash = Hash.keccak256String('Hello!');
 * const privateKey = PrivateKey.from(new Uint8Array(32));
 * const signature = Secp256k1.sign(messageHash, privateKey);
 * ```
 */
export function sign(messageHash, privateKey) {

	// Validate private key is not zero
	const isZero = privateKey.every((byte) => byte === 0);
	if (isZero) {
		throw new InvalidPrivateKeyError("Private key cannot be zero", {
			code: "PRIVATE_KEY_ZERO",
			docsPath: "/crypto/secp256k1/sign#error-handling",
		});
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
		throw new CryptoError(`Signing failed: ${error}`, {
			code: "SECP256K1_SIGN_FAILED",
			context: { messageHash, privateKeyLength: privateKey.length },
			docsPath: "/crypto/secp256k1/sign#error-handling",
			cause: error,
		});
	}
}

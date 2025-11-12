// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { InvalidSignatureError } from "../../primitives/errors/index.js";
import { SIGNATURE_COMPONENT_SIZE } from "./constants.js";

/**
 * Concatenate multiple Uint8Arrays
 * @param {...Uint8Array} arrays
 * @returns {Uint8Array}
 */
function concat(...arrays) {
	const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const arr of arrays) {
		result.set(arr, offset);
		offset += arr.length;
	}
	return result;
}

/**
 * Recover public key from signature and message hash
 *
 * Uses the recovery id (v) to recover the exact public key that created
 * the signature. This is what enables Ethereum's address recovery from
 * transaction signatures.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Object} signature - ECDSA signature components
 * @param {Uint8Array} signature.r - 32-byte signature component r
 * @param {Uint8Array} signature.s - 32-byte signature component s
 * @param {number} signature.v - Recovery id (27/28 or 0/1)
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash that was signed
 * @returns {import('./BrandedSecp256k1PublicKey.js').BrandedSecp256k1PublicKey} 64-byte uncompressed public key
 * @throws {InvalidSignatureError} If signature or recovery fails
 * @example
 * ```javascript
 * import * as Secp256k1 from './crypto/Secp256k1/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const messageHash = Hash.keccak256String('Hello');
 * const recovered = Secp256k1.recoverPublicKey(
 *   { r: rBytes, s: sBytes, v: 27 },
 *   messageHash
 * );
 * ```
 */
export function recoverPublicKey(signature, messageHash) {
	// Convert Ethereum v (27 or 28) to recovery bit (0 or 1)
	let recoveryBit;
	if (signature.v === 27 || signature.v === 28) {
		recoveryBit = signature.v - 27;
	} else if (signature.v === 0 || signature.v === 1) {
		recoveryBit = signature.v;
	} else {
		throw new InvalidSignatureError(
			`Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`,
			{
				code: "INVALID_SIGNATURE_V",
				context: { v: signature.v, expected: [0, 1, 27, 28] },
				docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
			},
		);
	}

	try {
		// Create compact signature from r and s
		const compactSig = concat(signature.r, signature.s);
		const sig = secp256k1.Signature.fromBytes(compactSig);

		// Add recovery bit and recover public key
		const sigWithRecovery = sig.addRecoveryBit(recoveryBit);
		const recovered = sigWithRecovery.recoverPublicKey(messageHash);
		const uncompressed = recovered.toBytes(false); // 65 bytes with 0x04 prefix

		if (uncompressed[0] !== 0x04) {
			throw new InvalidSignatureError("Invalid recovered public key format", {
				code: "INVALID_RECOVERED_KEY_FORMAT",
				context: { prefix: uncompressed[0], expected: 0x04 },
				docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
			});
		}

		// Return 64 bytes without the 0x04 prefix
		return /** @type {import('./BrandedSecp256k1PublicKey.js').BrandedSecp256k1PublicKey} */ (
			uncompressed.slice(1)
		);
	} catch (error) {
		throw new InvalidSignatureError(`Public key recovery failed: ${error}`, {
			code: "PUBLIC_KEY_RECOVERY_FAILED",
			context: { signature, messageHash },
			docsPath: "/crypto/secp256k1/recover-public-key#error-handling",
			cause: error,
		});
	}
}

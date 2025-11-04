// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { InvalidSignatureError } from "./errors.js";
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
 * @param {import('./BrandedSignature.js').BrandedSignature} signature - ECDSA signature with r, s, v components
 * @param {import('../../primitives/Hash/index.js').BrandedHash} messageHash - 32-byte message hash that was signed
 * @returns {Uint8Array} 64-byte uncompressed public key
 * @throws {InvalidSignatureError} If signature or recovery fails
 *
 * @example
 * ```typescript
 * const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
 * // recovered is 64 bytes: x || y coordinates
 * ```
 */
export function recoverPublicKey(signature, messageHash) {
	if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
		);
	}

	if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
		throw new InvalidSignatureError(
			`Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
		);
	}

	// Convert Ethereum v (27 or 28) to recovery bit (0 or 1)
	let recoveryBit;
	if (signature.v === 27 || signature.v === 28) {
		recoveryBit = signature.v - 27;
	} else if (signature.v === 0 || signature.v === 1) {
		recoveryBit = signature.v;
	} else {
		throw new InvalidSignatureError(
			`Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`,
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
			throw new InvalidSignatureError("Invalid recovered public key format");
		}

		// Return 64 bytes without the 0x04 prefix
		return uncompressed.slice(1);
	} catch (error) {
		throw new InvalidSignatureError(`Public key recovery failed: ${error}`);
	}
}

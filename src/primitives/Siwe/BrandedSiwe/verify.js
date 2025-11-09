import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Address from "../../Address/BrandedAddress/index.js";
import { getMessageHash } from "./getMessageHash.js";
import { validate } from "./validate.js";

/**
 * Verify a SIWE message signature
 *
 * @param {import('./BrandedMessage.js').BrandedMessage} message - The SIWE message that was signed
 * @param {import('./BrandedMessage.js').Signature} signature - The signature to verify (65 bytes: r, s, v)
 * @returns {boolean} true if signature is valid and matches message address
 *
 * @example
 * ```typescript
 * const valid = verify(message, signature);
 * if (valid) {
 *   // Signature is valid, user is authenticated
 * }
 * ```
 */
export function verify(message, signature) {
	// Validate message structure
	const validationResult = validate(message);
	if (!validationResult.valid) {
		return false;
	}

	// Get message hash
	const messageHash = getMessageHash(message);

	// Signature is 65 bytes: r (32) + s (32) + v (1)
	if (signature.length !== 65) {
		return false;
	}

	const r = signature.slice(0, 32);
	const s = signature.slice(32, 64);
	const v = signature[64];

	if (v === undefined) {
		return false;
	}

	// Normalize v to recovery id (0 or 1)
	let recoveryId;
	if (v >= 27) {
		recoveryId = v - 27;
	} else {
		recoveryId = v;
	}

	if (recoveryId !== 0 && recoveryId !== 1) {
		return false;
	}

	try {
		// Recover public key from signature
		const publicKey = Secp256k1.recoverPublicKey(
			{ r, s, v: recoveryId },
			/** @type {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} */ (
				messageHash
			),
		);

		// Derive address from public key
		let x = 0n;
		let y = 0n;
		for (let i = 0; i < 32; i++) {
			const xByte = publicKey[i];
			const yByte = publicKey[32 + i];
			if (xByte !== undefined && yByte !== undefined) {
				x = (x << 8n) | BigInt(xByte);
				y = (y << 8n) | BigInt(yByte);
			}
		}
		const recoveredAddress = Address.fromPublicKey(x, y);

		// Compare with message address
		if (recoveredAddress.length !== message.address.length) {
			return false;
		}
		for (let i = 0; i < recoveredAddress.length; i++) {
			if (recoveredAddress[i] !== message.address[i]) {
				return false;
			}
		}

		return true;
	} catch {
		return false;
	}
}

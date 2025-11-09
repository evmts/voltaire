import { PRIVATE_KEY_SIZE } from "../../../crypto/Secp256k1/constants.js";
// @ts-nocheck
import { derivePublicKey } from "../../../crypto/Secp256k1/derivePublicKey.js";
import { InvalidAddressLengthError, InvalidValueError } from "./errors.js";
import { fromPublicKey } from "./fromPublicKey.js";

/**
 * Create Address from secp256k1 private key
 *
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {import('./BrandedAddress.js').BrandedAddress} Address derived from private key
 * @throws {InvalidAddressLengthError} If private key length is invalid
 * @throws {InvalidValueError} If private key value is invalid
 *
 * @example
 * ```typescript
 * const privateKey = new Uint8Array(32); // Your key
 * const addr = Address.fromPrivateKey(privateKey);
 * ```
 */
export function fromPrivateKey(privateKey) {
	if (privateKey.length !== PRIVATE_KEY_SIZE) {
		throw new InvalidAddressLengthError(
			`Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
		);
	}

	// Derive 64-byte uncompressed public key
	let pubkey;
	try {
		pubkey = derivePublicKey(privateKey);
	} catch (error) {
		throw new InvalidValueError(`Invalid private key: ${error.message}`);
	}

	// Extract x and y coordinates (32 bytes each, big-endian)
	let x = 0n;
	let y = 0n;

	for (let i = 0; i < 32; i++) {
		x = (x << 8n) | BigInt(pubkey[i]);
		y = (y << 8n) | BigInt(pubkey[i + 32]);
	}

	// Call fromPublicKey to derive address
	return fromPublicKey(x, y);
}

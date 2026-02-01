import { InvalidLengthError } from "../errors/ValidationError.js";

/**
 * Compress a public key from 64 bytes (uncompressed) to 33 bytes (compressed)
 *
 * Compressed format: prefix (1 byte) + x-coordinate (32 bytes)
 * Prefix is 0x02 if y is even, 0x03 if y is odd
 *
 * @param {import('./PublicKeyType.js').PublicKeyType} publicKey - Uncompressed public key (64 bytes)
 * @returns {Uint8Array} Compressed public key (33 bytes)
 * @throws {InvalidLengthError} If public key is not 64 bytes
 *
 * @example
 * ```javascript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 * const compressed = PublicKey._compress(publicKey);
 * ```
 */
export function compress(publicKey) {
	// Validate input length
	if (publicKey.length !== 64) {
		throw new InvalidLengthError(
			`Invalid public key length: expected 64 bytes, got ${publicKey.length}`,
			{
				value: publicKey.length,
				expected: "64 bytes (uncompressed public key without 0x04 prefix)",
				code: "PUBLIC_KEY_INVALID_LENGTH",
				docsPath: "/primitives/public-key/compress#error-handling",
			},
		);
	}

	const result = new Uint8Array(33);

	// Parse y coordinate to determine parity
	let y = 0n;
	for (let i = 32; i < 64; i++) {
		y = (y << 8n) | BigInt(/** @type {number} */ (publicKey[i]));
	}

	// Set prefix based on y parity
	result[0] = y & 1n ? 0x03 : 0x02;

	// Copy x coordinate
	result.set(publicKey.slice(0, 32), 1);

	return result;
}

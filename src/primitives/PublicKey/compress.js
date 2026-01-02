/**
 * Compress a public key from 64 bytes (uncompressed) to 33 bytes (compressed)
 *
 * Compressed format: prefix (1 byte) + x-coordinate (32 bytes)
 * Prefix is 0x02 if y is even, 0x03 if y is odd
 *
 * Accepts either:
 * - 64 bytes: raw uncompressed key (x || y)
 * - 65 bytes: SEC1 uncompressed format (0x04 || x || y)
 *
 * @param {import('./PublicKeyType.js').PublicKeyType | Uint8Array} publicKey - Uncompressed public key (64 or 65 bytes)
 * @returns {Uint8Array} Compressed public key (33 bytes)
 * @throws {Error} If input is invalid length or format
 *
 * @example
 * ```javascript
 * import * as PublicKey from './primitives/PublicKey/index.js';
 * const compressed = PublicKey._compress(publicKey);
 * ```
 */
export function compress(publicKey) {
	// Validate input and extract key bytes
	/** @type {Uint8Array} */
	let keyBytes;

	if (publicKey.length === 65) {
		// SEC1 uncompressed format: 0x04 || x || y
		if (publicKey[0] !== 0x04) {
			throw new Error(
				`Invalid uncompressed public key prefix: expected 0x04, got 0x${/** @type {number} */ (publicKey[0]).toString(16).padStart(2, "0")}`,
			);
		}
		keyBytes = publicKey.slice(1);
	} else if (publicKey.length === 64) {
		// Raw format: x || y
		keyBytes = publicKey;
	} else {
		throw new Error(
			`Invalid public key length: expected 64 or 65 bytes, got ${publicKey.length}`,
		);
	}

	const result = new Uint8Array(33);

	// Parse y coordinate to determine parity
	let y = 0n;
	for (let i = 32; i < 64; i++) {
		y = (y << 8n) | BigInt(/** @type {number} */ (keyBytes[i]));
	}

	// Set prefix based on y parity
	result[0] = y & 1n ? 0x03 : 0x02;

	// Copy x coordinate
	result.set(keyBytes.slice(0, 32), 1);

	return result;
}

// @ts-nocheck
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { COMPRESSED_PUBLIC_KEY_SIZE } from "./constants.js";
import { InvalidPublicKeyError } from "./errors.js";

/**
 * Decompress compressed secp256k1 public key
 *
 * Converts 33-byte compressed format to 64-byte uncompressed format.
 * Decompresses by reconstructing y-coordinate from x and prefix.
 *
 * @see https://voltaire.tevm.sh/primitives/stealth-address for StealthAddress documentation
 * @since 0.0.0
 * @param {Uint8Array} compressed - 33-byte compressed public key
 * @returns {Uint8Array} 64-byte uncompressed public key
 * @throws {InvalidPublicKeyError} If input length is invalid or decompression fails
 * @example
 * ```javascript
 * import * as StealthAddress from './primitives/StealthAddress/index.js';
 * const compressed = new Uint8Array(33);
 * compressed[0] = 0x02; // even y
 * const uncompressed = StealthAddress.decompressPublicKey(compressed);
 * console.log(uncompressed.length); // 64
 * ```
 */
export function decompressPublicKey(compressed) {
	if (compressed.length !== COMPRESSED_PUBLIC_KEY_SIZE) {
		throw new InvalidPublicKeyError(
			`Compressed public key must be ${COMPRESSED_PUBLIC_KEY_SIZE} bytes, got ${compressed.length}`,
			{
				code: "INVALID_COMPRESSED_PUBLIC_KEY_LENGTH",
				context: { actualLength: compressed.length },
			},
		);
	}

	try {
		// Convert to hex string for Point.fromHex
		const hex = Array.from(compressed)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		// Decompress using Point.fromHex then convert to uncompressed bytes
		const point = secp256k1.Point.fromHex(hex);
		const uncompressedWithPrefix = point.toBytes(false);

		if (uncompressedWithPrefix[0] !== 0x04) {
			throw new InvalidPublicKeyError("Invalid decompressed format", {
				code: "INVALID_DECOMPRESSED_FORMAT",
				context: { prefix: uncompressedWithPrefix[0] },
			});
		}

		// Return 64 bytes without 0x04 prefix
		return uncompressedWithPrefix.slice(1, 65);
	} catch (error) {
		throw new InvalidPublicKeyError(
			`Public key decompression failed: ${error}`,
			{
				code: "DECOMPRESSION_FAILED",
				cause: error,
			},
		);
	}
}

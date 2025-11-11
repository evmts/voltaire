import type { BrandedPublicKey } from "./BrandedPublicKey.js";
import {
	InvalidFormatError,
	InvalidLengthError,
} from "../../errors/ValidationError.js";

const HEX_REGEX = /^[0-9a-fA-F]+$/;

/**
 * Create PublicKey from hex string
 *
 * @param hex - Hex string (64 bytes uncompressed)
 * @returns Public key
 * @throws {InvalidFormatError} If hex string format is invalid
 * @throws {InvalidLengthError} If hex is not 64 bytes
 *
 * @example
 * ```typescript
 * const pk = PublicKey.from("0x1234...");
 * ```
 */
export function from(hex: string): BrandedPublicKey {
	const hexStr = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!HEX_REGEX.test(hexStr)) {
		throw new InvalidFormatError("Invalid hex string", {
			value: hex,
			expected: "Valid hex string",
			code: "PUBLIC_KEY_INVALID_HEX",
			docsPath: "/primitives/public-key/from#error-handling",
		});
	}
	if (hexStr.length !== 128) {
		throw new InvalidLengthError(
			`Public key must be 64 bytes (128 hex chars), got ${hexStr.length}`,
			{
				value: hexStr.length,
				expected: "128 hex characters (64 bytes)",
				code: "PUBLIC_KEY_INVALID_LENGTH",
				docsPath: "/primitives/public-key/from#error-handling",
			},
		);
	}
	const bytes = new Uint8Array(64);
	for (let i = 0; i < 64; i++) {
		bytes[i] = Number.parseInt(hexStr.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes as BrandedPublicKey;
}

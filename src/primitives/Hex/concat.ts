import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import type { BrandedHex } from "./BrandedHex.js";
import { fromBytes } from "./fromBytes.js";
import { hexCharToValue } from "./utils.js";

/**
 * Concatenate multiple hex strings
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hexes - Hex strings to concatenate
 * @returns Concatenated hex string
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * Hex.concat('0x12', '0x34', '0x56'); // '0x123456'
 * ```
 */
export function concat(...hexes: BrandedHex[]): BrandedHex {
	const allBytes = hexes.flatMap((h) => {
		if (!h.startsWith("0x"))
			throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
				code: "HEX_MISSING_PREFIX",
				value: h,
				expected: "0x-prefixed hex string",
				docsPath: "/primitives/hex#error-handling",
			});

		const hexDigits = h.slice(2);
		if (hexDigits.length % 2 !== 0)
			throw new InvalidLengthError("Invalid hex length: odd number of digits", {
				code: "HEX_ODD_LENGTH",
				value: h,
				expected: "even number of hex digits",
				docsPath: "/primitives/hex#error-handling",
			});

		const bytes = new Uint8Array(hexDigits.length / 2);
		for (let i = 0; i < hexDigits.length; i += 2) {
			const charHigh = hexDigits[i];
			const charLow = hexDigits[i + 1];
			const high = hexCharToValue(charHigh);
			const low = hexCharToValue(charLow);
			if (high === null || low === null)
				throw new InvalidFormatError(
					`Invalid hex character at position ${i + 2}: '${charHigh ?? ""}${charLow ?? ""}'`,
					{
						code: "HEX_INVALID_CHARACTER",
						value: h,
						expected: "valid hex characters (0-9, a-f, A-F)",
						context: {
							position: i + 2,
							character: (charHigh ?? "") + (charLow ?? ""),
						},
						docsPath: "/primitives/hex#error-handling",
					},
				);
			bytes[i / 2] = high * 16 + low;
		}
		return Array.from(bytes);
	});
	return fromBytes(new Uint8Array(allBytes));
}

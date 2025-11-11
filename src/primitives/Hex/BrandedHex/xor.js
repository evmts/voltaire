import { InvalidFormatError, InvalidLengthError } from "../../errors/index.js";
import { fromBytes } from "./fromBytes.js";
import { hexCharToValue } from "./utils.js";

/**
 * XOR with another hex string of same length
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param {string} hex - First hex string
 * @param {string} other - Hex string to XOR with
 * @returns {string} XOR result
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits or lengths don't match
 * @example
 * ```javascript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x12');
 * const result = Hex.xor(hex, '0x34'); // '0x26'
 * ```
 */
export function xor(hex, other) {
	// Convert hex to bytes
	if (!hex.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: "HEX_MISSING_PREFIX",
			value: hex,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	const hexDigitsA = hex.slice(2);
	if (hexDigitsA.length % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: "HEX_ODD_LENGTH",
			value: hex,
			expected: "even number of hex digits",
			docsPath: "/primitives/hex#error-handling",
		});

	const bytesA = new Uint8Array(hexDigitsA.length / 2);
	for (let i = 0; i < hexDigitsA.length; i += 2) {
		const charHigh = hexDigitsA[i];
		const charLow = hexDigitsA[i + 1];
		const high = hexCharToValue(charHigh);
		const low = hexCharToValue(charLow);
		if (high === null || low === null)
			throw new InvalidFormatError(
				`Invalid hex character at position ${i + 2}: '${charHigh ?? ""}${charLow ?? ""}'`,
				{
					code: "HEX_INVALID_CHARACTER",
					value: hex,
					expected: "valid hex characters (0-9, a-f, A-F)",
					context: {
						position: i + 2,
						character: (charHigh ?? "") + (charLow ?? ""),
					},
					docsPath: "/primitives/hex#error-handling",
				},
			);
		bytesA[i / 2] = high * 16 + low;
	}

	// Convert other to bytes
	if (!other.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: "HEX_MISSING_PREFIX",
			value: other,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	const hexDigitsB = other.slice(2);
	if (hexDigitsB.length % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: "HEX_ODD_LENGTH",
			value: other,
			expected: "even number of hex digits",
			docsPath: "/primitives/hex#error-handling",
		});

	const bytesB = new Uint8Array(hexDigitsB.length / 2);
	for (let i = 0; i < hexDigitsB.length; i += 2) {
		const charHigh = hexDigitsB[i];
		const charLow = hexDigitsB[i + 1];
		const high = hexCharToValue(charHigh);
		const low = hexCharToValue(charLow);
		if (high === null || low === null)
			throw new InvalidFormatError(
				`Invalid hex character at position ${i + 2}: '${charHigh ?? ""}${charLow ?? ""}'`,
				{
					code: "HEX_INVALID_CHARACTER",
					value: other,
					expected: "valid hex characters (0-9, a-f, A-F)",
					context: {
						position: i + 2,
						character: (charHigh ?? "") + (charLow ?? ""),
					},
					docsPath: "/primitives/hex#error-handling",
				},
			);
		bytesB[i / 2] = high * 16 + low;
	}

	if (bytesA.length !== bytesB.length) {
		throw new InvalidLengthError("Hex strings must have same length for XOR", {
			code: "HEX_LENGTH_MISMATCH",
			value: hex,
			expected: `${bytesB.length} bytes`,
			context: { hexLength: bytesA.length, otherLength: bytesB.length },
			docsPath: "/primitives/hex#error-handling",
		});
	}
	const result = new Uint8Array(bytesA.length);
	for (let i = 0; i < bytesA.length; i++) {
		result[i] = (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
	}
	return fromBytes(result);
}

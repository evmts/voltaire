import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { fromBytes } from "./fromBytes.js";
import type { HexType } from "./HexType.js";
import { hexCharToValue } from "./utils.js";

/**
 * XOR with another hex string of same length
 *
 * @see https://voltaire.tevm.sh/primitives/hex for Hex documentation
 * @since 0.0.0
 * @param hex - First hex string
 * @param other - Hex string to XOR with
 * @returns XOR result
 * @throws {InvalidFormatError} If missing 0x prefix or contains invalid hex characters
 * @throws {InvalidLengthError} If hex has odd number of digits or lengths don't match
 * @example
 * ```typescript
 * import * as Hex from './primitives/Hex/index.js';
 * const hex = Hex.from('0x12');
 * const result = Hex.xor(hex, Hex.from('0x34')); // '0x26'
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic is inherently complex
export function xor(hex: HexType, other: HexType): HexType {
	// Convert hex to bytes
	if (!hex.startsWith("0x"))
		throw new InvalidFormatError("Invalid hex format: missing 0x prefix", {
			code: -32602,
			value: hex,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	const hexDigitsA = hex.slice(2);
	if (hexDigitsA.length % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: -32602,
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
					code: -32602,
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
			code: -32602,
			value: other,
			expected: "0x-prefixed hex string",
			docsPath: "/primitives/hex#error-handling",
		});

	const hexDigitsB = other.slice(2);
	if (hexDigitsB.length % 2 !== 0)
		throw new InvalidLengthError("Invalid hex length: odd number of digits", {
			code: -32602,
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
					code: -32602,
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
			code: -32602,
			value: hex,
			expected: `${bytesB.length} bytes`,
			context: { hexLength: bytesA.length, otherLength: bytesB.length },
			docsPath: "/primitives/hex#error-handling",
		});
	}
	const result = new Uint8Array(bytesA.length);
	for (let i = 0; i < bytesA.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: bounds checked by loop condition
		result[i] = bytesA[i]! ^ bytesB[i]!;
	}
	return fromBytes(result);
}

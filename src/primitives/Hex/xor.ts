import type { Unsized } from "./Hex.js";
import { InvalidFormatError, OddLengthError, InvalidCharacterError, InvalidLengthError } from "./errors.js";
import { hexCharToValue } from "./utils.js";
import { fromBytes } from "./fromBytes.js";

/**
 * XOR with another hex string of same length
 *
 * @param other - Hex string to XOR with
 * @returns XOR result
 * @throws {InvalidLengthError} If lengths don't match
 *
 * @example
 * ```typescript
 * const hex1: Hex = '0x12';
 * const result = Hex.xor.call(hex1, '0x34'); // '0x26'
 * ```
 */
export function xor(this: Unsized, other: Unsized): Unsized {
	// Convert this to bytes
	if (!this.startsWith("0x")) throw new InvalidFormatError();
	const hexDigitsA = this.slice(2);
	if (hexDigitsA.length % 2 !== 0) throw new OddLengthError();
	const bytesA = new Uint8Array(hexDigitsA.length / 2);
	for (let i = 0; i < hexDigitsA.length; i += 2) {
		const high = hexCharToValue(hexDigitsA[i]);
		const low = hexCharToValue(hexDigitsA[i + 1]);
		if (high === null || low === null) throw new InvalidCharacterError();
		bytesA[i / 2] = high * 16 + low;
	}

	// Convert other to bytes
	if (!other.startsWith("0x")) throw new InvalidFormatError();
	const hexDigitsB = other.slice(2);
	if (hexDigitsB.length % 2 !== 0) throw new OddLengthError();
	const bytesB = new Uint8Array(hexDigitsB.length / 2);
	for (let i = 0; i < hexDigitsB.length; i += 2) {
		const high = hexCharToValue(hexDigitsB[i]);
		const low = hexCharToValue(hexDigitsB[i + 1]);
		if (high === null || low === null) throw new InvalidCharacterError();
		bytesB[i / 2] = high * 16 + low;
	}

	if (bytesA.length !== bytesB.length) {
		throw new InvalidLengthError("Hex strings must have same length for XOR");
	}
	const result = new Uint8Array(bytesA.length);
	for (let i = 0; i < bytesA.length; i++) {
		result[i] = bytesA[i]! ^ bytesB[i]!;
	}
	return fromBytes(result);
}

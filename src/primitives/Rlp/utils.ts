import { Error } from "./errors.js";

/**
 * Encodes a length value as big-endian bytes (no leading zeros)
 * @internal
 */
export function encodeLengthValue(length: number): Uint8Array {
	if (length === 0) {
		return new Uint8Array(0);
	}

	// Calculate number of bytes needed
	let temp = length;
	let byteCount = 0;
	while (temp > 0) {
		byteCount++;
		temp = Math.floor(temp / 256);
	}

	// Encode as big-endian
	const result = new Uint8Array(byteCount);
	for (let i = byteCount - 1; i >= 0; i--) {
		result[i] = length & 0xff;
		length = Math.floor(length / 256);
	}

	return result;
}

/**
 * Decodes a big-endian length value
 * @internal
 */
export function decodeLengthValue(bytes: Uint8Array): number {
	if (bytes.length === 0) {
		return 0;
	}

	// Check for leading zeros
	if (bytes[0] === 0) {
		throw new Error("LeadingZeros", "Length encoding has leading zeros");
	}

	// Decode big-endian
	let result = 0;
	for (let i = 0; i < bytes.length; i++) {
		result = result * 256 + bytes[i]!;
	}

	return result;
}

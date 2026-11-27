/**
 * BLAKE2b synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Supports RFC 7693 variable digest lengths (1..=64 bytes) via `blake2Hash`.
 */

import {
	type Blake2Hash as Blake2HashType,
	SIZE,
} from "../../crypto/Blake2/Blake2HashType.js";
import { Blake2InvalidOutputLengthError } from "../../crypto/Blake2/errors.js";
import type { Blake2 as Blake2JS } from "../../crypto/Blake2/index.js";
import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";

const utf8Encoder = new TextEncoder();

/**
 * Compute BLAKE2b hash with variable digest length (1..=64 bytes, default 64).
 */
export function hash(
	data: Uint8Array | string,
	outputLength = 64,
): Blake2HashType {
	if (
		!Number.isInteger(outputLength) ||
		outputLength < 1 ||
		outputLength > 64
	) {
		throw new Blake2InvalidOutputLengthError(outputLength);
	}

	const input = typeof data === "string" ? utf8Encoder.encode(data) : data;
	const lib = loadNativeSync();
	const output = allocateOutput(outputLength);
	const code =
		outputLength === 64
			? lib.primitives_blake2b(safeBufferPtr(input), input.length, output)
			: lib.blake2Hash(
					safeBufferPtr(input),
					input.length,
					output,
					outputLength,
				);
	checkError(code, "blake2b");
	return output as Blake2HashType;
}

/**
 * Compute BLAKE2b hash of a UTF-8 string.
 */
export function hashString(str: string, outputLength = 64): Blake2HashType {
	return hash(str, outputLength);
}

/**
 * Universal constructor matching pure JS Blake2.from.
 */
export function from(
	input: Uint8Array | string,
	outputLength = 64,
): Blake2HashType {
	if (input instanceof Uint8Array) {
		return hash(input, outputLength);
	}
	if (typeof input === "string") {
		return hashString(input, outputLength);
	}
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

export { SIZE };

export const Blake2Hash = Object.assign(from, {
	from,
	fromString: hashString,
	hash,
	hashString,
	SIZE,
}) satisfies typeof Blake2JS;

export const Blake2 = Blake2Hash;
export default Blake2Hash;

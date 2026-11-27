/**
 * RIPEMD160 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS Ripemd160.
 */

import { HEX_SIZE, SIZE } from "../../crypto/Ripemd160/constants.js";
import type { Ripemd160 as Ripemd160JS } from "../../crypto/Ripemd160/index.js";
import type { Ripemd160Hash as Ripemd160HashType } from "../../crypto/Ripemd160/Ripemd160HashType.js";
import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";
import { parseHexByte } from "../../primitives/Hex/parseHexByte.js";

const utf8Encoder = new TextEncoder();

/**
 * Compute RIPEMD-160 hash (20 bytes) via native Zig FFI.
 */
export function hash(data: Uint8Array | string): Ripemd160HashType {
	const input = typeof data === "string" ? utf8Encoder.encode(data) : data;
	const lib = loadNativeSync();
	const output = allocateOutput(SIZE);
	const code = lib.primitives_ripemd160(
		safeBufferPtr(input),
		input.length,
		output,
	);
	checkError(code, "ripemd160");
	return output as Ripemd160HashType;
}

/**
 * Compute RIPEMD-160 hash of a UTF-8 string.
 */
export function hashString(str: string): Ripemd160HashType {
	return hash(utf8Encoder.encode(str));
}

/**
 * Compute RIPEMD-160 hash of a hex string (with or without 0x prefix).
 */
export function hashHex(hex: string): Ripemd160HashType {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(normalized, i * 2);
	}
	return hash(bytes);
}

/**
 * Universal constructor matching pure JS Ripemd160.from.
 */
export function from(input: Uint8Array | string): Ripemd160HashType {
	if (input instanceof Uint8Array) {
		return hash(input);
	}
	if (typeof input === "string") {
		return hashString(input);
	}
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

export { HEX_SIZE, SIZE };

export const Ripemd160Hash = Object.assign(from, {
	from,
	fromString: hashString,
	fromHex: hashHex,
	hash,
	hashString,
	hashHex,
	SIZE,
	HEX_SIZE,
}) satisfies typeof Ripemd160JS;

export const Ripemd160 = Ripemd160Hash;

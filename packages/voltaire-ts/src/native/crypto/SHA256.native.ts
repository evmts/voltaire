/**
 * SHA256 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS SHA256.
 */

import { BLOCK_SIZE, OUTPUT_SIZE } from "../../crypto/SHA256/constants.js";
import type { SHA256 as SHA256JS } from "../../crypto/SHA256/index.js";
import type { SHA256Hash as SHA256HashType } from "../../crypto/SHA256/SHA256HashType.js";
import { toHex } from "../../crypto/SHA256/toHex.js";
import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";
import { parseHexByte } from "../../primitives/Hex/parseHexByte.js";

const utf8Encoder = new TextEncoder();

/**
 * Compute SHA-256 hash of raw bytes via native Zig FFI.
 */
export function hash(data: Uint8Array): SHA256HashType {
	const lib = loadNativeSync();
	const output = allocateOutput(OUTPUT_SIZE);
	const code = lib.primitives_sha256(safeBufferPtr(data), data.length, output);
	checkError(code, "sha256");
	return output as SHA256HashType;
}

/**
 * Compute SHA-256 hash of a UTF-8 string via native Zig FFI.
 */
export function hashString(str: string): SHA256HashType {
	return hash(utf8Encoder.encode(str));
}

/**
 * Compute SHA-256 hash of a hex string (with or without 0x prefix) via native Zig FFI.
 */
export function hashHex(hex: string): SHA256HashType {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(normalized, i * 2);
	}
	return hash(bytes);
}

/**
 * Universal constructor matching pure JS SHA256.from.
 */
export function from(input: Uint8Array | string): SHA256HashType {
	if (input instanceof Uint8Array) {
		return hash(input);
	}
	if (typeof input === "string") {
		if (input.startsWith("0x") || /^[0-9a-fA-F]*$/.test(input)) {
			return hashHex(input);
		}
		return hashString(input);
	}
	throw new TypeError(
		`Invalid input type. Expected Uint8Array or string, got ${typeof input}`,
	);
}

/**
 * Streaming SHA-256 hasher backed by native Zig FFI on finalize.
 */
export function create(): {
	update: (data: Uint8Array) => void;
	digest: () => Uint8Array;
} {
	const chunks: Uint8Array[] = [];
	let totalLength = 0;

	return {
		update(data: Uint8Array): void {
			const copy = new Uint8Array(data.length);
			copy.set(data);
			chunks.push(copy);
			totalLength += copy.length;
		},
		digest(): Uint8Array {
			const combined = new Uint8Array(totalLength);
			let offset = 0;
			for (const chunk of chunks) {
				combined.set(chunk, offset);
				offset += chunk.length;
			}
			return hash(combined);
		},
	};
}

export { BLOCK_SIZE, OUTPUT_SIZE, toHex };

export const SHA256Hash = Object.assign(from, {
	from,
	fromString: hashString,
	fromHex: hashHex,
	hash,
	hashString,
	hashHex,
	toHex,
	create,
	OUTPUT_SIZE,
	BLOCK_SIZE,
}) satisfies typeof SHA256JS;

export const SHA256 = SHA256Hash;

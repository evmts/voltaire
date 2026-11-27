/**
 * Keccak256 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Matches the pure JS Keccak256 API 1:1 with zero async overhead.
 */

import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";
import {
	InvalidFormatError,
	InvalidLengthError,
} from "../../primitives/errors/ValidationError.js";
import { parseHexByte } from "../../primitives/Hex/parseHexByte.js";
import { encodeList } from "../../primitives/Rlp/encodeList.js";
import { DIGEST_SIZE, RATE, STATE_SIZE } from "./constants.js";
import type { Keccak256Hash as Keccak256HashType } from "./Keccak256HashType.js";

const MAX_U64 = 0xffffffffffffffffn;
const utf8Encoder = new TextEncoder();

function nonceToBytes(nonce: bigint): Uint8Array {
	if (nonce === 0n) {
		return new Uint8Array(0);
	}
	const hex = nonce.toString(16);
	const paddedHex = hex.length % 2 ? `0${hex}` : hex;
	const bytes = new Uint8Array(paddedHex.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(paddedHex, i * 2);
	}
	return bytes;
}

/**
 * Hash raw bytes with Keccak-256 using native Zig FFI.
 */
export function hash(data: Uint8Array): Keccak256HashType {
	const lib = loadNativeSync();
	const output = allocateOutput(DIGEST_SIZE);
	const code = lib.primitives_keccak256(
		safeBufferPtr(data),
		data.length,
		output,
	);
	checkError(code, "keccak256");
	return output as Keccak256HashType;
}

/**
 * Synchronous hash alias (retained for backward compatibility).
 */
export function hashSync(data: Uint8Array): Keccak256HashType {
	return hash(data);
}

/**
 * Hash hex string (with or without 0x prefix) with Keccak-256 using native FFI.
 */
export function hashHex(hex: string): Keccak256HashType {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (!/^[0-9a-fA-F]*$/.test(normalized)) {
		throw new InvalidFormatError("Invalid hex string", {
			code: -32602,
			value: hex,
			expected: "Hex string (0-9, a-f, A-F)",
			docsPath: "/crypto/keccak256/hash-hex#error-handling",
		});
	}
	if (normalized.length % 2 !== 0) {
		throw new InvalidFormatError("Hex string must have even length", {
			code: -32602,
			value: hex,
			expected: "Even number of hex characters",
			docsPath: "/crypto/keccak256/hash-hex#error-handling",
		});
	}
	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(normalized, i * 2);
	}
	return hash(bytes);
}

/**
 * Hash UTF-8 string with Keccak-256 using native FFI.
 */
export function hashString(str: string): Keccak256HashType {
	return hash(utf8Encoder.encode(str));
}

/**
 * Universal constructor - accepts hex string, UTF-8 string, or Uint8Array.
 */
export function from(input: Uint8Array | string): Keccak256HashType {
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
 * Hash multiple byte chunks sequentially.
 */
export function hashMultiple(chunks: readonly Uint8Array[]): Keccak256HashType {
	let totalLength = 0;
	for (const chunk of chunks) {
		totalLength += chunk.length;
	}
	const combined = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		combined.set(chunk, offset);
		offset += chunk.length;
	}
	return hash(combined);
}

/**
 * Compute 4-byte Ethereum function selector (first 4 bytes of keccak256(signature)).
 */
export function selector(signature: string): Uint8Array {
	return hashString(signature).slice(0, 4);
}

/**
 * Compute 32-byte Ethereum event topic hash.
 */
export function topic(signature: string): Keccak256HashType {
	return hashString(signature);
}

/**
 * Compute CREATE contract address from deployer address and nonce.
 */
export function contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array {
	if (sender.length !== 20) {
		throw new InvalidLengthError("Sender must be 20 bytes", {
			code: -32602,
			value: sender,
			expected: "20 bytes",
			context: { length: sender.length, nonce },
			docsPath: "/crypto/keccak256/contract-address#error-handling",
		});
	}
	if (nonce >= 0n && nonce <= MAX_U64) {
		const lib = loadNativeSync();
		const output = allocateOutput(20);
		const code = lib.primitives_calculate_create_address(sender, nonce, output);
		checkError(code, "calculate_create_address");
		return output;
	}
	const rlpEncoded = encodeList([sender, nonceToBytes(nonce)]);
	return hash(rlpEncoded).slice(12);
}

/**
 * Compute CREATE2 contract address from sender, 32-byte salt, and 32-byte initCodeHash.
 */
export function create2Address(
	sender: Uint8Array,
	salt: Uint8Array,
	initCodeHash: Uint8Array,
): Uint8Array {
	if (sender.length !== 20) {
		throw new InvalidLengthError("Sender must be 20 bytes", {
			code: -32602,
			value: sender,
			expected: "20 bytes",
			context: { length: sender.length },
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	if (salt.length !== 32) {
		throw new InvalidLengthError("Salt must be 32 bytes", {
			code: -32602,
			value: salt,
			expected: "32 bytes",
			context: { length: salt.length },
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	if (initCodeHash.length !== 32) {
		throw new InvalidLengthError("Init code hash must be 32 bytes", {
			code: -32602,
			value: initCodeHash,
			expected: "32 bytes",
			context: { length: initCodeHash.length },
			docsPath: "/crypto/keccak256/create2-address#error-handling",
		});
	}
	const data = new Uint8Array(85);
	data[0] = 0xff;
	data.set(sender, 1);
	data.set(salt, 21);
	data.set(initCodeHash, 53);
	return hash(data).slice(12);
}

export { DIGEST_SIZE, RATE, STATE_SIZE };

/**
 * Synchronous Native Keccak256 namespace matching pure JS Keccak256 1:1.
 */
export const Keccak256Hash = Object.assign(from, {
	from,
	fromString: hashString,
	fromHex: hashHex,
	fromTopic: topic,
	hash,
	hashString,
	hashHex,
	hashMultiple,
	hashSync,
	selector,
	topic,
	contractAddress,
	create2Address,
	DIGEST_SIZE,
	RATE,
	STATE_SIZE,
});

export const Keccak256 = Keccak256Hash;

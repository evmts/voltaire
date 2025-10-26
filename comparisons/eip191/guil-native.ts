// Using @noble/hashes for benchmark compatibility
// Note: The native Zig+FFI implementation is faster, but this allows cross-runtime comparison
import { keccak_256 } from "@noble/hashes/sha3.js";
import { bytesToHex as toHex } from "@noble/hashes/utils.js";

// Test data: string message
const message = "Hello, Ethereum!";

// Test data: bytes message
const bytesMessage = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

/**
 * EIP-191 personal message hashing
 * Format: "\x19Ethereum Signed Message:\n" + len(message) + message
 */
function hashMessage(message: string | Uint8Array): string {
	const messageBytes =
		typeof message === "string" ? new TextEncoder().encode(message) : message;

	// EIP-191 prefix: "\x19Ethereum Signed Message:\n"
	const prefix = "\x19Ethereum Signed Message:\n";
	const prefixBytes = new TextEncoder().encode(prefix);

	// Length as string
	const lengthString = messageBytes.length.toString();
	const lengthBytes = new TextEncoder().encode(lengthString);

	// Concatenate: prefix + length + message
	const data = new Uint8Array(
		prefixBytes.length + lengthBytes.length + messageBytes.length,
	);
	data.set(prefixBytes, 0);
	data.set(lengthBytes, prefixBytes.length);
	data.set(messageBytes, prefixBytes.length + lengthBytes.length);

	// Hash with keccak256
	const hash = keccak_256(data);
	return `0x${toHex(hash)}`;
}

export function main(): void {
	// Test with string message
	const hash1 = hashMessage(message);

	// Test with bytes message
	const hash2 = hashMessage(bytesMessage);
}

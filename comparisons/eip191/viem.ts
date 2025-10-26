import { hashMessage } from "viem";

// Test data: string message
const message = "Hello, Ethereum!";

// Test data: bytes message
const bytesMessage = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

export function main(): void {
	// Test with string message
	const hash1 = hashMessage(message);

	// Test with bytes message
	// Viem requires { raw: Uint8Array } format for bytes
	const hash2 = hashMessage({ raw: bytesMessage });
}

/**
 * Example 1: Hex Utilities and Keccak-256 Hashing
 *
 * Demonstrates:
 * - Converting between hex strings and byte arrays
 * - Computing Keccak-256 hashes
 * - Working with hex data
 */

import { hexToBytes, bytesToHex } from "../../src/typescript/utils/hex";
import {
	keccak256,
	keccak256Hex,
} from "../../src/typescript/primitives/keccak";

console.log("=== Hex Utilities and Keccak-256 Hashing ===\n");

// Example 1.1: Hex to Bytes Conversion
console.log("1.1: Hex to Bytes");
const hexString = "0x48656c6c6f20576f726c64"; // "Hello World" in hex
const bytes = hexToBytes(hexString);
console.log("Hex string:", hexString);
console.log("Byte array:", bytes);
console.log("Decoded text:", new TextDecoder().decode(bytes));
console.log();

// Example 1.2: Bytes to Hex Conversion
console.log("1.2: Bytes to Hex");
const message = "Hello World";
const messageBytes = new TextEncoder().encode(message);
const messageHex = bytesToHex(messageBytes);
console.log("Original text:", message);
console.log("Byte array:", messageBytes);
console.log("Hex string:", messageHex);
console.log();

// Example 1.3: Keccak-256 Hashing (bytes input)
console.log("1.3: Keccak-256 Hashing (bytes)");
const data = new TextEncoder().encode("test");
const hash = keccak256(data);
const hashHex = bytesToHex(hash);
console.log("Input:", "test");
console.log("Hash (bytes):", hash);
console.log("Hash (hex):", hashHex);
console.log();

// Example 1.4: Keccak-256 Hashing (hex input/output)
console.log("1.4: Keccak-256 Hashing (hex)");
const hexData = "0x1234567890abcdef";
const hexHash = keccak256Hex(hexData);
console.log("Input:", hexData);
console.log("Hash:", hexHash);
console.log();

// Example 1.5: Empty String Hash
console.log("1.5: Empty String Hash");
const emptyHash = keccak256Hex("0x");
console.log("Empty string hash:", emptyHash);
console.log(
	"Known value: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
);
console.log(
	"Match:",
	emptyHash ===
		"0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
);
console.log();

// Example 1.6: Function Selector
console.log("1.6: Function Selector (first 4 bytes of keccak256)");
const functionSig = "transfer(address,uint256)";
const sigBytes = new TextEncoder().encode(functionSig);
const sigHash = keccak256(sigBytes);
const selector = bytesToHex(sigHash.slice(0, 4));
console.log("Function signature:", functionSig);
console.log("Full hash:", bytesToHex(sigHash));
console.log("Function selector:", selector);
console.log();

// Example 1.7: Event Signature
console.log("1.7: Event Signature (keccak256 of event signature)");
const eventSig = "Transfer(address,address,uint256)";
const eventBytes = new TextEncoder().encode(eventSig);
const eventHash = keccak256(eventBytes);
console.log("Event signature:", eventSig);
console.log("Topic0 (hash):", bytesToHex(eventHash));

/**
 * Basic Hash Usage Example
 *
 * Demonstrates:
 * - Creating hashes from various input types (hex, bytes)
 * - Basic conversions (hex, bytes, string)
 * - Validation and type checking
 * - Basic comparisons
 */

import { Hash } from "../../../src/primitives/Hash/index.js";

// From hex string (most common)
const hash1 = new Hash(
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
);

// From hex using static method
const hash2 = Hash.fromHex(
	"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
);

// From bytes
const bytes = new Uint8Array(32);
bytes[0] = 0x12;
bytes[1] = 0x34;
bytes[31] = 0xff;
const hash3 = Hash.fromBytes(bytes);

// Random hash (cryptographically secure)
const randomHash = Hash.random();

const hash = Hash.fromHex(
	"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8",
);

// Convert to bytes
const hashBytes = hash.toBytes();

// Valid hex strings
const validHex1 =
	"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
const validHex2 =
	"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // No 0x prefix
const invalidHex = "0x1234"; // Too short

// Safe parsing with validation
function parseHash(input: string): Hash | null {
	if (!Hash.isValidHex(input)) {
		return null;
	}
	try {
		return Hash.fromHex(input);
	} catch (error) {
		return null;
	}
}
parseHash(validHex1);
parseHash(invalidHex);

function processValue(value: unknown) {
	if (Hash.isHash(value)) {
	} else {
	}
}

processValue(hash);
processValue(new Uint8Array(32)); // Valid 32-byte array
processValue(new Uint8Array(20)); // Wrong length
processValue("0x1234"); // String, not Hash

// Create test hashes
const hashA = Hash.keccak256String("hello");
const hashB = Hash.keccak256String("hello");
const hashC = Hash.keccak256String("world");
const zeroHash = Hash.fromBytes(new Uint8Array(32));

const hash4 = Hash.keccak256String("example");
for (let i = 0; i < 8; i++) {}

const original = Hash.keccak256String("data");

// Clone creates independent copy
const cloned = original.clone();

// Modifying clone doesn't affect original
cloned[0] = 0xff;

// Slicing (get portion of hash)
const functionSignature = Hash.keccak256String("transfer(address,uint256)");
const selector = Uint8Array.prototype.slice.call(functionSignature, 0, 4);

// Using constants for validation
const buffer = new Uint8Array(Hash.SIZE); // Correct size

// Zero hash comparison
const testHash = Hash.fromBytes(new Uint8Array(32));

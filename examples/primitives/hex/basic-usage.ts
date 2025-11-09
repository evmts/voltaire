/**
 * Basic Hex Usage Example
 *
 * Demonstrates:
 * - Creating hex strings from various input types
 * - Basic validation and type checking
 * - Converting between hex and other formats
 * - Size checking
 */

import { Hex } from "@tevm/voltaire";

console.log("=== Basic Hex Usage ===\n");

// 1. Creating Hex from different inputs
console.log("1. Creating Hex:");

// From hex string
const hex1 = Hex("0x1234");
console.log(`  From string: ${hex1}`);

// From bytes
const bytes = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
const hex2 = Hex.fromBytes(bytes);
console.log(`  From bytes: ${hex2}`);

// From number
const hex3 = Hex.fromNumber(255);
console.log(`  From number (255): ${hex3}`);

// From bigint with padding
const hex4 = Hex.fromBigInt(255n, 32);
console.log(`  From bigint (255n, 32 bytes): ${hex4}`);

// From string (UTF-8 encoding)
const hex5 = Hex.fromString("hello");
console.log(`  From UTF-8 string: ${hex5}`);

// From boolean
const hex6 = Hex.fromBoolean(true);
const hex7 = Hex.fromBoolean(false);
console.log(`  From boolean (true): ${hex6}`);
console.log(`  From boolean (false): ${hex7}`);

// 2. Validation
console.log("\n2. Validation:");

// Type guard
const maybeHex = "0x1234";
if (Hex.isHex(maybeHex)) {
	console.log(`  "${maybeHex}" is valid hex`);
	const size = Hex.size(maybeHex);
	console.log(`  Size: ${size} bytes`);
}

// Invalid examples
const invalid = ["1234", "0xGHI", "0x 123"];
invalid.forEach((val) => {
	console.log(`  "${val}" is valid: ${Hex.isHex(val)}`);
});

// 3. Conversions
console.log("\n3. Conversions:");

const data = Hex("0x68656c6c6f"); // "hello" encoded

// To bytes
const convertedBytes = Hex.toBytes(data);
console.log(
	`  To bytes: [${Array.from(convertedBytes)
		.map((b) => `0x${b.toString(16)}`)
		.join(", ")}]`,
);

// To string (UTF-8 decode)
const str = Hex.toString(data);
console.log(`  To UTF-8 string: "${str}"`);

// To number (for small values)
const smallHex = Hex("0xff");
const num = Hex.toNumber(smallHex);
console.log(`  To number: ${num}`);

// To bigint (for any size)
const bigint = Hex.toBigInt(data);
console.log(`  To bigint: ${bigint}n`);

// To boolean (non-zero check)
console.log(`  To boolean (0x01): ${Hex.toBoolean(Hex("0x01"))}`);
console.log(`  To boolean (0x00): ${Hex.toBoolean(Hex("0x00"))}`);

// 4. Size operations
console.log("\n4. Size operations:");

const addr = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
console.log(`  Address size: ${Hex.size(addr)} bytes`);

// Check specific size
console.log(`  Is 20 bytes? ${Hex.isSized(addr, 20)}`);
console.log(`  Is 32 bytes? ${Hex.isSized(addr, 32)}`);

// Assert size (throws if wrong)
try {
	const validAddr = Hex.assertSize(addr, 20);
	console.log(`  ✓ Address is exactly 20 bytes`);
} catch (e) {
	console.log(`  ✗ Size assertion failed`);
}

console.log("\n=== Example completed ===\n");

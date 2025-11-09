/**
 * Random Generation and Utilities Example
 *
 * Demonstrates:
 * - Generating cryptographically secure random hex
 * - Creating zero-filled hex values
 * - Checking equality
 * - Size utilities
 * - Common Ethereum patterns
 */

import { Hex } from "@tevm/voltaire";

console.log("=== Random Generation and Utilities ===\n");

// 1. Random generation
console.log("1. Random generation (cryptographically secure):");

// Random private key (32 bytes)
const privateKey = Hex.random(32);
console.log(`  Random private key: ${privateKey}`);
console.log(`  Size: ${Hex.size(privateKey)} bytes`);

// Random address (20 bytes)
const randomAddress = Hex.random(20);
console.log(`  Random address: ${randomAddress}`);

// Random nonce (8 bytes)
const nonce = Hex.random(8);
console.log(`  Random nonce: ${nonce}`);

// Random salt for CREATE2
const salt = Hex.random(32);
console.log(`  Random CREATE2 salt: ${salt}`);

// Random test data
const testData = Hex.random(16);
console.log(`  Random test data: ${testData}`);

// 2. Zero values
console.log("\n2. Zero values:");

// Zero address
const ZERO_ADDRESS = Hex.zero(20);
console.log(`  Zero address: ${ZERO_ADDRESS}`);

// Zero hash
const ZERO_HASH = Hex.zero(32);
console.log(`  Zero hash: ${ZERO_HASH}`);

// Empty hex
const EMPTY = Hex.zero(0);
console.log(`  Empty hex: ${EMPTY}`);

// Single zero byte
const ZERO_BYTE = Hex.zero(1);
console.log(`  Zero byte: ${ZERO_BYTE}`);

// 3. Equality checking
console.log("\n3. Equality checking:");

const addr1 = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const addr2 = Hex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"); // Different case
const addr3 = Hex("0x0000000000000000000000000000000000000000");

console.log(`  Address 1: ${addr1}`);
console.log(`  Address 2: ${addr2}`);
console.log(`  Are equal (case-insensitive): ${Hex.equals(addr1, addr2)}`);
console.log(`  Equal to different address: ${Hex.equals(addr1, addr3)}`);

// Check if zero address
function isZeroAddress(address: string): boolean {
	return Hex.equals(Hex(address), ZERO_ADDRESS);
}

console.log(`  Is addr1 zero address? ${isZeroAddress(addr1)}`);
console.log(`  Is addr3 zero address? ${isZeroAddress(addr3)}`);

// 4. Size utilities
console.log("\n4. Size utilities:");

const hash = Hex.random(32);
const address = Hex.random(20);
const selector = Hex("0xa9059cbb");
const empty = Hex("0x");

console.log(`  Hash size: ${Hex.size(hash)} bytes`);
console.log(`  Address size: ${Hex.size(address)} bytes`);
console.log(`  Selector size: ${Hex.size(selector)} bytes`);
console.log(`  Empty size: ${Hex.size(empty)} bytes`);

// Size validation
console.log(`  Hash is 32 bytes? ${Hex.isSized(hash, 32)}`);
console.log(`  Address is 20 bytes? ${Hex.isSized(address, 20)}`);
console.log(`  Selector is 4 bytes? ${Hex.isSized(selector, 4)}`);

// 5. Practical utilities
console.log("\n5. Practical utilities:");

// Check if any value is zero
function isZero(hex: string): boolean {
	const value = Hex(hex);
	return Hex.equals(value, Hex.zero(Hex.size(value)));
}

console.log(`  Is 0x0000 zero? ${isZero("0x0000")}`);
console.log(`  Is 0x0001 zero? ${isZero("0x0001")}`);

// Find unique addresses
const addresses = [
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	Hex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"), // Duplicate (different case)
	Hex("0x1234567890123456789012345678901234567890"),
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"), // Duplicate
];

const unique = addresses.filter(
	(addr, i, arr) => arr.findIndex((a) => Hex.equals(a, addr)) === i,
);

console.log(`  Total addresses: ${addresses.length}`);
console.log(`  Unique addresses: ${unique.length}`);

// Filter non-zero addresses
const someAddresses = [
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	ZERO_ADDRESS,
	Hex("0x1234567890123456789012345678901234567890"),
	ZERO_ADDRESS,
];

const nonZero = someAddresses.filter((addr) => !Hex.equals(addr, ZERO_ADDRESS));
console.log(`  Total addresses: ${someAddresses.length}`);
console.log(`  Non-zero addresses: ${nonZero.length}`);

// Sort by size
const various = [Hex.random(32), Hex.random(4), Hex.random(20), Hex.random(8)];

const sorted = [...various].sort((a, b) => Hex.size(a) - Hex.size(b));
console.log(
	`  Sorted by size: ${sorted.map((h) => `${Hex.size(h)} bytes`).join(", ")}`,
);

// 6. Common Ethereum constants
console.log("\n6. Common Ethereum constants:");

// Zero address (burn address)
const BURN_ADDRESS = Hex.zero(20);
console.log(`  Burn address: ${BURN_ADDRESS}`);

// Empty root hash
const EMPTY_ROOT = Hex.zero(32);
console.log(`  Empty root: ${EMPTY_ROOT}`);

// Function selectors are 4 bytes
const TRANSFER_SELECTOR = Hex("0xa9059cbb");
console.log(`  Transfer selector: ${TRANSFER_SELECTOR}`);
console.log(`  Is 4 bytes? ${Hex.isSized(TRANSFER_SELECTOR, 4)}`);

// Storage slots are 32 bytes
const STORAGE_SLOT_0 = Hex.zero(32);
console.log(`  Storage slot 0: ${STORAGE_SLOT_0}`);

// 7. Testing utilities
console.log("\n7. Testing utilities:");

// Generate deterministic-looking test data
function generateTestAddress(seed: number): string {
	// In real tests, you'd use random, but this shows the pattern
	const randomAddr = Hex.random(20);
	return randomAddr;
}

// Create mock values
const mockPrivateKey = Hex.random(32);
const mockAddress = Hex.random(20);
const mockHash = Hex.random(32);
const mockSignature = Hex.random(65); // r + s + v

console.log(`  Mock private key: ${mockPrivateKey.slice(0, 16)}...`);
console.log(`  Mock address: ${mockAddress}`);
console.log(`  Mock hash: ${mockHash.slice(0, 16)}...`);
console.log(
	`  Mock signature: ${mockSignature.slice(0, 16)}... (${Hex.size(mockSignature)} bytes)`,
);

// Validate sizes
try {
	Hex.assertSize(mockPrivateKey, 32);
	Hex.assertSize(mockAddress, 20);
	Hex.assertSize(mockHash, 32);
	Hex.assertSize(mockSignature, 65);
	console.log(`  ✓ All mock values have correct sizes`);
} catch (e) {
	console.log(`  ✗ Size validation failed`);
}

console.log("\n=== Example completed ===\n");

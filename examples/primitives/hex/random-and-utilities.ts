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

// Random private key (32 bytes)
const privateKey = Hex.random(32);

// Random address (20 bytes)
const randomAddress = Hex.random(20);

// Random nonce (8 bytes)
const nonce = Hex.random(8);

// Random salt for CREATE2
const salt = Hex.random(32);

// Random test data
const testData = Hex.random(16);

// Zero address
const ZERO_ADDRESS = Hex.zero(20);

// Zero hash
const ZERO_HASH = Hex.zero(32);

// Empty hex
const EMPTY = Hex.zero(0);

// Single zero byte
const ZERO_BYTE = Hex.zero(1);

const addr1 = Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
const addr2 = Hex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"); // Different case
const addr3 = Hex("0x0000000000000000000000000000000000000000");

// Check if zero address
function isZeroAddress(address: string): boolean {
	return Hex.equals(Hex(address), ZERO_ADDRESS);
}

const hash = Hex.random(32);
const address = Hex.random(20);
const selector = Hex("0xa9059cbb");
const empty = Hex("0x");

// Check if any value is zero
function isZero(hex: string): boolean {
	const value = Hex(hex);
	return Hex.equals(value, Hex.zero(Hex.size(value)));
}

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

// Filter non-zero addresses
const someAddresses = [
	Hex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	ZERO_ADDRESS,
	Hex("0x1234567890123456789012345678901234567890"),
	ZERO_ADDRESS,
];

const nonZero = someAddresses.filter((addr) => !Hex.equals(addr, ZERO_ADDRESS));

// Sort by size
const various = [Hex.random(32), Hex.random(4), Hex.random(20), Hex.random(8)];

const sorted = [...various].sort((a, b) => Hex.size(a) - Hex.size(b));

// Zero address (burn address)
const BURN_ADDRESS = Hex.zero(20);

// Empty root hash
const EMPTY_ROOT = Hex.zero(32);

// Function selectors are 4 bytes
const TRANSFER_SELECTOR = Hex("0xa9059cbb");

// Storage slots are 32 bytes
const STORAGE_SLOT_0 = Hex.zero(32);

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

// Validate sizes
try {
	Hex.assertSize(mockPrivateKey, 32);
	Hex.assertSize(mockAddress, 20);
	Hex.assertSize(mockHash, 32);
	Hex.assertSize(mockSignature, 65);
} catch (e) {}

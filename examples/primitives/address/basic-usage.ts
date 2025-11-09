/**
 * Basic Address Usage Example
 *
 * Demonstrates:
 * - Creating addresses from various input types (hex, bytes, numbers)
 * - Basic conversions (hex, checksummed, short display)
 * - Validation and type checking
 */

import { Address } from "../../../src/primitives/Address/index.js";

console.log("=== Basic Address Usage ===\n");

// 1. Creating addresses from different inputs
console.log("1. Creating Addresses\n");

// From hex string (most common)
const addr1 = new Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
console.log(`From hex: ${addr1.toChecksummed()}`);

// From number/bigint (takes lower 160 bits)
const addr2 = Address.fromNumber(69n);
console.log(`From number: ${addr2.toHex()}`);

// From bytes
const bytes = new Uint8Array(20);
bytes[19] = 42; // Last byte = 42
const addr3 = Address.fromBytes(bytes);
console.log(`From bytes: ${addr3.toHex()}`);

// Zero address
const zeroAddr = Address.zero();
console.log(`Zero address: ${zeroAddr.toHex()}\n`);

// 2. Format conversions
console.log("2. Format Conversions\n");

const addr = new Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

// Various hex formats
console.log(`Lowercase:   ${addr.toHex()}`);
console.log(`Checksummed: ${addr.toChecksummed()}`); // EIP-55 mixed case
console.log(`Uppercase:   ${addr.toUppercase()}`);
console.log(`Short:       ${addr.toShortHex()}`); // For UI display
console.log(`Short (8,6): ${addr.toShortHex(8, 6)}\n`);

// 3. Validation
console.log("3. Validation\n");

const validAddr = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const invalidAddr = "0x742d35Cc"; // Too short
const wrongChecksum = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e"; // All lowercase

console.log(`Valid format (${validAddr}): ${Address.isValid(validAddr)}`);
console.log(`Invalid format (${invalidAddr}): ${Address.isValid(invalidAddr)}`);
console.log(
	`Valid checksum (checksummed): ${Address.isValidChecksum(validAddr)}`,
);
console.log(
	`Valid checksum (lowercase): ${Address.isValidChecksum(wrongChecksum)}`,
); // true - all same case
console.log();

// 4. Type guards
console.log("4. Type Guards\n");

function processValue(value: unknown) {
	if (Address.is(value)) {
		console.log(`✓ Valid Address: ${Address.toHex(value)}`);
	} else {
		console.log(`✗ Not an Address: ${typeof value}`);
	}
}

processValue(addr);
processValue("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
processValue(new Uint8Array(20));
processValue(new Uint8Array(32)); // Wrong length
console.log();

// 5. Comparisons
console.log("5. Basic Comparisons\n");

const addrA = new Address(100n);
const addrB = new Address(100n);
const addrC = new Address(200n);

console.log(`Address A: ${addrA.toHex()}`);
console.log(`Address B: ${addrB.toHex()}`);
console.log(`Address C: ${addrC.toHex()}`);
console.log(`A equals B: ${addrA.equals(addrB)}`); // true
console.log(`A equals C: ${addrA.equals(addrC)}`); // false
console.log(`Zero check: ${zeroAddr.isZero()}`); // true
console.log(`A is zero: ${addrA.isZero()}`); // false

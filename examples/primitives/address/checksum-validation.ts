/**
 * EIP-55 Checksum Validation Example
 *
 * Demonstrates:
 * - EIP-55 checksummed address generation
 * - Checksum validation and verification
 * - Detecting invalid checksums to prevent typos
 * - Safe parsing with checksum requirements
 */

import { Address } from "../../../src/primitives/Address/index.js";

console.log("=== EIP-55 Checksum Validation ===\n");

// 1. Understanding EIP-55 checksums
console.log("1. EIP-55 Checksumming\n");

const addr = new Address("0x742d35cc6634c0532925a3b844bc9e7595f51e3e");

console.log("EIP-55 uses mixed-case encoding for error detection:");
console.log(`Original (lowercase): ${addr.toHex()}`);
console.log(`Checksummed:         ${addr.toChecksummed()}`);
console.log("Notice: Some letters capitalized based on keccak256 hash\n");

// 2. Checksum validation
console.log("2. Checksum Validation\n");

const validChecksummed = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const invalidChecksum = "0x742d35cc6634C0532925a3b844Bc9e7595f51e3e"; // Wrong case
const allLowercase = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e";
const allUppercase = "0x742D35CC6634C0532925A3B844BC9E7595F51E3E";

console.log(
	`Valid checksummed:   ${Address.isValidChecksum(validChecksummed)}`,
);
console.log(`Invalid checksum:    ${Address.isValidChecksum(invalidChecksum)}`);
console.log(`All lowercase:       ${Address.isValidChecksum(allLowercase)}`); // true - no checksum
console.log(`All uppercase:       ${Address.isValidChecksum(allUppercase)}`); // true - no checksum
console.log();

// 3. Detecting typos with checksums
console.log("3. Typo Detection\n");

function safeParseAddress(input: string): Address | null {
	// Validate format first
	if (!Address.isValid(input)) {
		console.log(`✗ Invalid format: ${input}`);
		return null;
	}

	// If mixed case, validate checksum
	const hasMixedCase =
		input !== input.toLowerCase() && input !== input.toUpperCase();
	if (hasMixedCase && !Address.isValidChecksum(input)) {
		console.log(`✗ Invalid checksum (possible typo): ${input}`);
		return null;
	}

	const addr = Address.fromHex(input);
	console.log(`✓ Valid address: ${addr.toChecksummed()}`);
	return addr;
}

// Valid addresses
safeParseAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"); // Valid checksum
safeParseAddress("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"); // Lowercase (no checksum)

// Typo - one wrong character case
safeParseAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f51E3e"); // Last 'E' should be lowercase
console.log();

// 4. Strict checksum enforcement
console.log("4. Strict Checksum Enforcement\n");

function requireChecksum(input: string): Address {
	if (!Address.isValidChecksum(input)) {
		throw new Error(`Address must have valid EIP-55 checksum: ${input}`);
	}

	// Ensure it's actually checksummed (not all same case)
	const hasMixedCase =
		input !== input.toLowerCase() && input !== input.toUpperCase();
	if (!hasMixedCase) {
		throw new Error(`Address must be checksummed (mixed case): ${input}`);
	}

	return Address.fromHex(input);
}

try {
	const strictAddr = requireChecksum(
		"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
	);
	console.log(`✓ Accepted: ${strictAddr.toChecksummed()}`);
} catch (e) {
	console.log(`✗ Rejected: ${(e as Error).message}`);
}

try {
	requireChecksum("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"); // All lowercase
} catch (e) {
	console.log(`✗ Rejected: ${(e as Error).message}`);
}
console.log();

// 5. Converting addresses to checksummed format
console.log("5. Converting to Checksummed Format\n");

const addresses = [
	"0x742d35cc6634c0532925a3b844bc9e7595f51e3e",
	"0xA0CF798816D4B9B9866B5330EEA46A18382F251E",
	"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
];

console.log("Converting addresses to EIP-55 checksummed format:");
for (const addrStr of addresses) {
	const addr = Address.fromHex(addrStr);
	const checksummed = addr.toChecksummed();
	console.log(`${addrStr}`);
	console.log(`→ ${checksummed}\n`);
}

// 6. Practical usage: User input validation
console.log("6. User Input Validation\n");

function validateUserInput(input: string): {
	valid: boolean;
	address?: Address;
	error?: string;
} {
	// Trim whitespace
	const trimmed = input.trim();

	// Check basic format
	if (!Address.isValid(trimmed)) {
		return { valid: false, error: "Invalid address format" };
	}

	// Check checksum if mixed case
	const hasMixedCase =
		trimmed !== trimmed.toLowerCase() && trimmed !== trimmed.toUpperCase();
	if (hasMixedCase && !Address.isValidChecksum(trimmed)) {
		// Provide the correct checksummed version
		const addr = Address.fromHex(trimmed);
		const correct = addr.toChecksummed();
		return {
			valid: false,
			error: `Invalid checksum. Did you mean: ${correct}?`,
		};
	}

	const address = Address.fromHex(trimmed);
	return { valid: true, address };
}

const userInputs = [
	"0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e", // Correct
	"0x742d35cc6634C0532925a3b844Bc9e7595f51e3e", // Wrong checksum
	"  0x742d35cc6634c0532925a3b844bc9e7595f51e3e  ", // With whitespace
	"0xINVALID",
];

for (const input of userInputs) {
	const result = validateUserInput(input);
	if (result.valid) {
		console.log(`✓ "${input}"`);
		console.log(`  → ${result.address!.toChecksummed()}\n`);
	} else {
		console.log(`✗ "${input}"`);
		console.log(`  → ${result.error}\n`);
	}
}

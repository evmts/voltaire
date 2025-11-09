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

const addr = new Address("0x742d35cc6634c0532925a3b844bc9e7595f51e3e");

const validChecksummed = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
const invalidChecksum = "0x742d35cc6634C0532925a3b844Bc9e7595f51e3e"; // Wrong case
const allLowercase = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e";
const allUppercase = "0x742D35CC6634C0532925A3B844BC9E7595F51E3E";

function safeParseAddress(input: string): Address | null {
	// Validate format first
	if (!Address.isValid(input)) {
		return null;
	}

	// If mixed case, validate checksum
	const hasMixedCase =
		input !== input.toLowerCase() && input !== input.toUpperCase();
	if (hasMixedCase && !Address.isValidChecksum(input)) {
		return null;
	}

	const addr = Address.fromHex(input);
	return addr;
}

// Valid addresses
safeParseAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"); // Valid checksum
safeParseAddress("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"); // Lowercase (no checksum)

// Typo - one wrong character case
safeParseAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f51E3e"); // Last 'E' should be lowercase

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
} catch (e) {}

try {
	requireChecksum("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"); // All lowercase
} catch (e) {}

const addresses = [
	"0x742d35cc6634c0532925a3b844bc9e7595f51e3e",
	"0xA0CF798816D4B9B9866B5330EEA46A18382F251E",
	"0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
];
for (const addrStr of addresses) {
	const addr = Address.fromHex(addrStr);
	const checksummed = addr.toChecksummed();
}

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
	} else {
	}
}

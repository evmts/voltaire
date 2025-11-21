import { describe, expect, test } from "vitest";
import * as Domain from "./index.js";

/**
 * Example usage of ERC-5267 implementation
 *
 * Demonstrates how to use the Domain primitive with ERC-5267
 * response formatting for smart contracts.
 */
describe("ERC-5267 Usage Example", () => {
	test("complete workflow: create domain and get ERC-5267 response", () => {
		// 1. Create a domain from user input (loose typing)
		const domain = Domain.from({
			name: "MyDApp",
			version: "1.0.0",
			chainId: 1, // Can pass number
			verifyingContract: "0x742d35Cc6634c0532925a3b844bc9e7595f251e3", // Can pass string
		});

		// 2. Convert to ERC-5267 response format
		const response = Domain.toErc5267Response(domain);

		// 3. Verify response structure
		expect(response.fields).toBeInstanceOf(Uint8Array);
		expect(response.fields.length).toBe(1);

		// Bitmap should have name + version + chainId + verifyingContract bits set
		expect(response.fields[0]).toBe(0x0f);

		// All fields properly formatted
		expect(response.name).toBe("MyDApp");
		expect(response.version).toBe("1.0.0");
		expect(response.chainId).toBe(1n); // Converted to bigint for ERC-5267
		expect(response.verifyingContract).toBeInstanceOf(Uint8Array);
		expect(response.verifyingContract.length).toBe(20);

		// Default values for missing fields
		expect(response.salt).toBeInstanceOf(Uint8Array);
		expect(response.salt.length).toBe(32);
		expect(response.extensions).toEqual([]);
	});

	test("get field bitmap directly", () => {
		const domain = Domain.from({
			name: "Test",
			chainId: 137,
		});

		const bitmap = Domain.getFieldsBitmap(domain);

		// Should have name (0x01) + chainId (0x04) = 0x05
		expect(bitmap[0]).toBe(0x05);
	});

	test("ERC-5267 field constants", () => {
		// Field bitmap constants are exported
		expect(Domain.ERC5267_FIELDS.NAME).toBe(0x01);
		expect(Domain.ERC5267_FIELDS.VERSION).toBe(0x02);
		expect(Domain.ERC5267_FIELDS.CHAIN_ID).toBe(0x04);
		expect(Domain.ERC5267_FIELDS.VERIFYING_CONTRACT).toBe(0x08);
		expect(Domain.ERC5267_FIELDS.SALT).toBe(0x10);
		expect(Domain.ERC5267_FIELDS.EXTENSIONS).toBe(0x20);
	});

	test("response matches EIP-712 domain", () => {
		// Create domain using EIP-712 fields
		const domain = Domain.from({
			name: "MyContract",
			version: "1",
			chainId: 1,
			verifyingContract: "0x1234567890123456789012345678901234567890",
		});

		// Get ERC-5267 response
		const response = Domain.toErc5267Response(domain);

		// Response should match domain input
		expect(response.name).toBe(domain.name);
		expect(response.version).toBe(domain.version);
		expect(response.chainId).toBe(BigInt(domain.chainId ?? 0));
		expect(response.verifyingContract).toBe(domain.verifyingContract);
	});
});

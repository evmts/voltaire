import { describe, expect, it } from "vitest";
import { hash } from "../../crypto/Keccak256/hash.js";
import { IsValidChecksum } from "./isValidChecksum.js";

describe("isValidChecksum", () => {
	describe("valid checksummed addresses", () => {
		it("validates EIP-55 test vector 1", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(true);
		});

		it("validates EIP-55 test vector 2", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
			).toBe(true);
		});

		it("validates EIP-55 test vector 3", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB"),
			).toBe(true);
		});

		it("validates EIP-55 test vector 4", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb"),
			).toBe(true);
		});

		it("validates checksummed address without 0x prefix", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(isValidChecksum("5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toBe(
				true,
			);
		});
	});

	describe("invalid checksum", () => {
		it("rejects wrong casing in first character", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Changed first 'a' to 'A'
			expect(
				isValidChecksum("0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(false);
		});

		it("rejects wrong casing in middle", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Changed 'F' to 'f' in test vector 1
			expect(
				isValidChecksum("0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(false);
		});

		it("rejects wrong casing at end", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Changed last 'd' to 'D'
			expect(
				isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeD"),
			).toBe(false);
		});

		it("rejects multiple wrong cases", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aAeB6053f3e94c9b9a09f33669435e7eF1BeAed"),
			).toBe(false);
		});
	});

	describe("all lowercase", () => {
		it("rejects all lowercase (doesn't match checksum)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
			).toBe(false);
		});

		it("rejects another all lowercase address", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("accepts zero address as lowercase (special case)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x0000000000000000000000000000000000000000"),
			).toBe(true);
		});
	});

	describe("all uppercase", () => {
		it("rejects all uppercase (doesn't match checksum)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED"),
			).toBe(false);
		});

		it("rejects another all uppercase address", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x742D35CC6634C0532925A3B844BC9E7595F251E3"),
			).toBe(false);
		});

		it("rejects max address as uppercase", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"),
			).toBe(false);
		});
	});

	describe("invalid address format", () => {
		it("rejects invalid hex characters", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeZ"),
			).toBe(false);
		});

		it("rejects too short address", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAe")).toBe(
				false,
			);
		});

		it("rejects too long address", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed00"),
			).toBe(false);
		});

		it("rejects empty string", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(isValidChecksum("")).toBe(false);
		});

		it("rejects non-hex string", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(isValidChecksum("not an address")).toBe(false);
		});
	});

	describe("with and without prefix", () => {
		it("validates with 0x prefix", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(true);
		});

		it("validates without 0x prefix", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(isValidChecksum("5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toBe(
				true,
			);
		});

		it("rejects invalid checksum without prefix", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(isValidChecksum("5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed")).toBe(
				false,
			);
		});
	});

	describe("EIP-55 case sensitivity edge cases (Issue #147)", () => {
		it("rejects swapping a single uppercase letter to lowercase", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Original: 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
			// Changed 'A' at position 3 to 'a'
			expect(
				isValidChecksum("0x5aaeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(false);
		});

		it("rejects swapping a single lowercase letter to uppercase", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Original: 0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed
			// Changed 'b' at position 5 to 'B'
			expect(
				isValidChecksum("0x5aAeB6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(false);
		});

		it("treats numeric-only addresses as valid (no case to check)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Address with only numeric characters - checksum is trivially valid
			expect(
				isValidChecksum("0x1111111111111111111111111111111111111111"),
			).toBe(true);
		});

		it("validates address where correct checksum happens to be all lowercase letters", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// 0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359 - most letters happen to be lowercase
			// Correct checksum: 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359
			expect(
				isValidChecksum("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
			).toBe(true);
			// All lowercase should fail
			expect(
				isValidChecksum("0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359"),
			).toBe(false);
		});

		it("validates address where correct checksum happens to be mostly uppercase letters", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// 0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb - has many uppercase in checksum
			// Correct checksum: 0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB
			expect(
				isValidChecksum("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB"),
			).toBe(true);
			// All uppercase should fail
			expect(
				isValidChecksum("0xDBF03B407C01E7CD3CBEA99509D93F8DDDC8C6FB"),
			).toBe(false);
		});

		it("is consistent: toChecksummed output always passes isValidChecksum", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Test that checksumming any valid address produces a valid checksum
			const testAddresses = [
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
				"0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359",
				"0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb",
				"0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb",
			];

			for (const addr of testAddresses) {
				// Generate checksum from raw lowercase
				const lowerAddr = addr.toLowerCase();
				const encoder = new TextEncoder();
				const hashInput = lowerAddr.slice(2);
				const hashResult = hash(encoder.encode(hashInput));

				let checksummed = "0x";
				for (let i = 0; i < 40; i++) {
					const char = hashInput[i];
					if (char === undefined) break;
					const hashByte = hashResult[Math.floor(i / 2)];
					if (hashByte === undefined) break;
					const nibble = i % 2 === 0 ? hashByte >> 4 : hashByte & 0x0f;
					checksummed += nibble >= 8 ? char.toUpperCase() : char;
				}

				expect(isValidChecksum(checksummed)).toBe(true);
			}
		});
	});
});

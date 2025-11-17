import { describe, expect, it } from "vitest";
import { hash } from "../../../crypto/Keccak256/hash.js";
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
});

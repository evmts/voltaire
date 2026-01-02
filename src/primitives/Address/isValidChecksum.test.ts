import { describe, expect, it } from "vitest";
import { hash } from "../../crypto/Keccak256/hash.js";
import { IsValidChecksum } from "./isValidChecksum.js";

describe("isValidChecksum", () => {
	describe("valid checksummed addresses", () => {
		it("validates EIP-55 test vector 1 (normal)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"),
			).toBe(true);
		});

		it("validates EIP-55 test vector 2 (normal)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"),
			).toBe(true);
		});

		it("validates EIP-55 test vector 3 (normal)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB"),
			).toBe(true);
		});

		it("validates EIP-55 test vector 4 (normal)", () => {
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

	describe("EIP-55 official all-caps test vectors", () => {
		// These addresses happen to have checksums that result in all uppercase letters
		it("validates EIP-55 all-caps test vector 1", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x52908400098527886E0F7030069857D2E4169EE7"),
			).toBe(true);
		});

		it("validates EIP-55 all-caps test vector 2", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x8617E340B3D01FA5F11F306F4090FD50E238070D"),
			).toBe(true);
		});
	});

	describe("EIP-55 official all-lowercase test vectors", () => {
		// These addresses happen to have checksums that result in all lowercase letters
		it("validates EIP-55 all-lower test vector 1", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0xde709f2102306220921060314715629080e2fb77"),
			).toBe(true);
		});

		it("validates EIP-55 all-lower test vector 2", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			expect(
				isValidChecksum("0x27b1fdb04752bbc536007a920d24acb045561c26"),
			).toBe(true);
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

	describe("incorrectly cased all-lowercase (checksum should be mixed-case)", () => {
		// These addresses have checksums that require mixed case, so all-lowercase is invalid
		it("rejects all lowercase when checksum requires mixed case", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// This is the lowercase form of test vector 1, but checksum requires mixed case
			expect(
				isValidChecksum("0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed"),
			).toBe(false);
		});

		it("rejects another incorrectly lowercased address", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// This address checksum requires mixed case, not all lowercase
			expect(
				isValidChecksum("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("accepts zero address (no alpha chars to checksum)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Zero address has no alpha chars, so it's always valid
			expect(
				isValidChecksum("0x0000000000000000000000000000000000000000"),
			).toBe(true);
		});
	});

	describe("incorrectly cased all-uppercase (checksum should be mixed-case)", () => {
		// These addresses have checksums that require mixed case, so all-uppercase is invalid
		it("rejects all uppercase when checksum requires mixed case", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// This is the uppercase form of test vector 1, but checksum requires mixed case
			expect(
				isValidChecksum("0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED"),
			).toBe(false);
		});

		it("rejects another incorrectly uppercased address", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// This address checksum requires mixed case, not all uppercase
			expect(
				isValidChecksum("0x742D35CC6634C0532925A3B844BC9E7595F251E3"),
			).toBe(false);
		});

		it("rejects max address as uppercase (checksum requires mixed case)", () => {
			const isValidChecksum = IsValidChecksum({ keccak256: hash });
			// Max address (all f's) checksum is NOT all uppercase
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

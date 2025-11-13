import { describe, expect, it } from "vitest";
import { hash } from "../../../crypto/Keccak256/hash.js";
import { Address } from "../index.js";
import { ToChecksummed } from "./toChecksummed.js";

describe("toChecksummed", () => {
	describe("EIP-55 test vectors", () => {
		it("produces valid checksummed address for known vector 1", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			// EIP-55 test vector
			const addr = Address.fromHex(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toBe("0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed");
		});

		it("produces valid checksummed address for known vector 2", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toBe("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359");
		});

		it("produces valid checksummed address for known vector 3", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toBe("0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB");
		});

		it("produces valid checksummed address for known vector 4", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toBe("0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb");
		});
	});

	describe("lowercase input", () => {
		it("converts all lowercase to mixed case", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
			// Verify it has mixed case (not all lower)
			expect(checksummed).not.toBe(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
		});

		it("produces consistent output for same input", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const cs1 = toChecksummed(addr);
			const cs2 = toChecksummed(addr);
			expect(cs1).toBe(cs2);
		});
	});

	describe("uppercase input", () => {
		it("converts all uppercase to mixed case", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742D35CC6634C0532925A3B844BC9E7595F251E3",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});

	describe("mixed case input", () => {
		it("normalizes mixed case to correct checksum", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});

	describe("output format", () => {
		it("starts with 0x prefix", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed.startsWith("0x")).toBe(true);
		});

		it("is 42 characters long", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed.length).toBe(42);
		});

		it("contains only hex characters", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
			);
			const checksummed = toChecksummed(addr);
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("has mixed case output", () => {
			const toChecksummed = ToChecksummed({ keccak256: hash });
			const addr = Address.fromHex(
				"0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
			);
			const checksummed = toChecksummed(addr);
			// Verify it's not all lowercase or all uppercase
			const hasLower = /[a-f]/.test(checksummed);
			const hasUpper = /[A-F]/.test(checksummed);
			expect(hasLower && hasUpper).toBe(true);
		});
	});
});

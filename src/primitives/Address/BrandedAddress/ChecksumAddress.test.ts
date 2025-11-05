import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import * as ChecksumAddress from "./ChecksumAddress.js";

describe("ChecksumAddress", () => {
	describe("from", () => {
		it("returns checksummed string", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const checksummed = ChecksumAddress.from(addr);
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});

		it("handles all lowercase input", () => {
			const addr = Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
			const checksummed = ChecksumAddress.from(addr);
			expect(typeof checksummed).toBe("string");
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("handles all uppercase input", () => {
			const addr = Address.fromHex("0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD");
			const checksummed = ChecksumAddress.from(addr);
			expect(typeof checksummed).toBe("string");
			expect(checksummed).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("returns same result for same address", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const checksummed1 = ChecksumAddress.from(addr);
			const checksummed2 = ChecksumAddress.from(addr);
			expect(checksummed1).toBe(checksummed2);
		});

		it("handles zero address", () => {
			const addr = Address.zero();
			const checksummed = ChecksumAddress.from(addr);
			expect(checksummed).toBe("0x0000000000000000000000000000000000000000");
		});

		it("type brands as checksummed", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const checksummed = ChecksumAddress.from(addr);
			// Type assertion to verify brand
			const _branded: ChecksumAddress.Checksummed = checksummed;
			expect(checksummed).toBe("0x742d35Cc6634c0532925a3b844bc9e7595F251E3");
		});
	});

	describe("isValid", () => {
		it("validates EIP-55 checksum", () => {
			expect(
				ChecksumAddress.isValid("0x742d35Cc6634c0532925a3b844bc9e7595F251E3"),
			).toBe(true);
		});

		it("rejects incorrect checksum", () => {
			expect(
				ChecksumAddress.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251e3"),
			).toBe(false);
		});

		it("rejects all uppercase (unless valid)", () => {
			expect(
				ChecksumAddress.isValid("0x742D35CC6634C0532925A3B844BC9E7595F251E3"),
			).toBe(false);
		});

		it("validates zero address", () => {
			expect(
				ChecksumAddress.isValid("0x0000000000000000000000000000000000000000"),
			).toBe(true);
		});

		it("validates address without 0x prefix", () => {
			expect(
				ChecksumAddress.isValid("742d35Cc6634c0532925a3b844bc9e7595F251E3"),
			).toBe(true);
		});

		it("rejects invalid hex", () => {
			expect(ChecksumAddress.isValid("0x742d35cc6634")).toBe(false);
		});

		it("rejects non-hex characters", () => {
			expect(
				ChecksumAddress.isValid("0x742d35cc6634c0532925a3b844bc9e7595f251gz"),
			).toBe(false);
		});

		it("rejects empty string", () => {
			expect(ChecksumAddress.isValid("")).toBe(false);
		});

		it("rejects null", () => {
			expect(ChecksumAddress.isValid(null as any)).toBe(false);
		});
	});

	describe("roundtrip", () => {
		it("from then isValid returns true", () => {
			const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
			const checksummed = ChecksumAddress.from(addr);
			expect(ChecksumAddress.isValid(checksummed)).toBe(true);
		});

		it("works with multiple addresses", () => {
			const addresses = [
				"0x742d35cc6634c0532925a3b844bc9e7595f251e3",
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
				"0x1234567890123456789012345678901234567890",
			];

			for (const hex of addresses) {
				const addr = Address.fromHex(hex);
				const checksummed = ChecksumAddress.from(addr);
				expect(ChecksumAddress.isValid(checksummed)).toBe(true);
			}
		});
	});
});

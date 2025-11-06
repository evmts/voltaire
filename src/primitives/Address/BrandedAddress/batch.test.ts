import { describe, expect, it } from "vitest";
import * as Address from "./index.js";

describe("Address batch operations", () => {
	describe("sortAddresses", () => {
		it("sorts addresses lexicographically", () => {
			const addr1 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);
			const addr3 = Address.fromHex(
				"0x0000000000000000000000000000000000000003",
			);

			const sorted = Address.sortAddresses([addr3, addr1, addr2]);

			expect(Address.equals(sorted[0], addr1)).toBe(true);
			expect(Address.equals(sorted[1], addr2)).toBe(true);
			expect(Address.equals(sorted[2], addr3)).toBe(true);
		});

		it("returns new array", () => {
			const addresses = [
				Address.fromHex("0x0000000000000000000000000000000000000002"),
				Address.fromHex("0x0000000000000000000000000000000000000001"),
			];
			const sorted = Address.sortAddresses(addresses);

			expect(sorted).not.toBe(addresses);
		});

		it("handles empty array", () => {
			const sorted = Address.sortAddresses([]);
			expect(sorted).toEqual([]);
		});

		it("handles single address", () => {
			const addr = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const sorted = Address.sortAddresses([addr]);

			expect(sorted).toHaveLength(1);
			expect(Address.equals(sorted[0], addr)).toBe(true);
		});
	});

	describe("deduplicateAddresses", () => {
		it("removes duplicate addresses", () => {
			const addr1 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);
			const addr3 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);

			const unique = Address.deduplicateAddresses([addr1, addr2, addr3]);

			expect(unique).toHaveLength(2);
			expect(Address.equals(unique[0], addr1)).toBe(true);
			expect(Address.equals(unique[1], addr2)).toBe(true);
		});

		it("preserves first occurrence", () => {
			const addr1a = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);
			const addr1b = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);

			const unique = Address.deduplicateAddresses([addr1a, addr2, addr1b]);

			expect(unique).toHaveLength(2);
			expect(unique[0]).toBe(addr1a);
			expect(unique[1]).toBe(addr2);
		});

		it("returns new array", () => {
			const addresses = [
				Address.fromHex("0x0000000000000000000000000000000000000001"),
				Address.fromHex("0x0000000000000000000000000000000000000002"),
			];
			const unique = Address.deduplicateAddresses(addresses);

			expect(unique).not.toBe(addresses);
		});

		it("handles empty array", () => {
			const unique = Address.deduplicateAddresses([]);
			expect(unique).toEqual([]);
		});

		it("handles array with no duplicates", () => {
			const addr1 = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);
			const addr2 = Address.fromHex(
				"0x0000000000000000000000000000000000000002",
			);

			const unique = Address.deduplicateAddresses([addr1, addr2]);

			expect(unique).toHaveLength(2);
		});

		it("handles array with all duplicates", () => {
			const addr = Address.fromHex(
				"0x0000000000000000000000000000000000000001",
			);

			const unique = Address.deduplicateAddresses([addr, addr, addr]);

			expect(unique).toHaveLength(1);
			expect(Address.equals(unique[0], addr)).toBe(true);
		});
	});
});

import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import * as AddressNamespace from "./index.js";

describe("of", () => {
	describe("valid inputs", () => {
		it("creates address from 20 bytes", () => {
			const addr = Address.of(
				0x74,
				0x2d,
				0x35,
				0xcc,
				0x66,
				0x34,
				0xc0,
				0x53,
				0x29,
				0x25,
				0xa3,
				0xb8,
				0x44,
				0xbc,
				0x9e,
				0x75,
				0x95,
				0xf2,
				0x51,
				0xe3,
			);
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
		});

		it("creates address with correct byte values", () => {
			const addr = Address.of(
				0x00,
				0x01,
				0x02,
				0x03,
				0x04,
				0x05,
				0x06,
				0x07,
				0x08,
				0x09,
				0x0a,
				0x0b,
				0x0c,
				0x0d,
				0x0e,
				0x0f,
				0x10,
				0x11,
				0x12,
				0x13,
			);
			for (let i = 0; i < 20; i++) {
				expect(addr[i]).toBe(i);
			}
		});

		it("creates zero address from all zeros", () => {
			const addr = Address.of(
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
			);
			expect(
				Address.isZero(addr as import("./BrandedAddress.js").BrandedAddress),
			).toBe(true);
		});

		it("creates address with all 0xff bytes", () => {
			const addr = Address.of(
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
				0xff,
			);
			for (let i = 0; i < 20; i++) {
				expect(addr[i]).toBe(0xff);
			}
		});

		it("creates address with mixed byte values", () => {
			const addr = Address.of(
				0x12,
				0x34,
				0x56,
				0x78,
				0x9a,
				0xbc,
				0xde,
				0xf0,
				0x11,
				0x22,
				0x33,
				0x44,
				0x55,
				0x66,
				0x77,
				0x88,
				0x99,
				0xaa,
				0xbb,
				0xcc,
			);
			expect(addr[0]).toBe(0x12);
			expect(addr[1]).toBe(0x34);
			expect(addr[18]).toBe(0xbb);
			expect(addr[19]).toBe(0xcc);
		});

		it("returns Address instance", () => {
			const addr = Address.of(
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				16,
				17,
				18,
				19,
				20,
			);
			expect(Address.is(addr)).toBe(true);
		});

		it("creates valid address", () => {
			const addr = Address.of(
				0x74,
				0x2d,
				0x35,
				0xcc,
				0x66,
				0x34,
				0xc0,
				0x53,
				0x29,
				0x25,
				0xa3,
				0xb8,
				0x44,
				0xbc,
				0x9e,
				0x75,
				0x95,
				0xf2,
				0x51,
				0xe3,
			);
			const hex = Address.toHex(
				addr as import("./BrandedAddress.js").BrandedAddress,
			);
			expect(Address.isValid(hex)).toBe(true);
		});
	});

	describe("wrong byte count", () => {
		it("throws on too few bytes", () => {
			expect(() =>
				Address.of(
					1,
					2,
					3,
					4,
					5,
					6,
					7,
					8,
					9,
					10,
					11,
					12,
					13,
					14,
					15,
					16,
					17,
					18,
					19,
				),
			).toThrow(AddressNamespace.InvalidAddressLengthError);
		});

		it("throws on too many bytes", () => {
			expect(() =>
				Address.of(
					1,
					2,
					3,
					4,
					5,
					6,
					7,
					8,
					9,
					10,
					11,
					12,
					13,
					14,
					15,
					16,
					17,
					18,
					19,
					20,
					21,
				),
			).toThrow(AddressNamespace.InvalidAddressLengthError);
		});

		it("throws on zero bytes", () => {
			expect(() => Address.of()).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws on one byte", () => {
			expect(() => Address.of(1)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});
	});

	describe("invalid byte values", () => {
		it("truncates values > 255 to lower 8 bits", () => {
			const addr = Address.of(
				256,
				257,
				258,
				259,
				260,
				261,
				262,
				263,
				264,
				265,
				266,
				267,
				268,
				269,
				270,
				271,
				272,
				273,
				274,
				275,
			);
			expect(addr[0]).toBe(0);
			expect(addr[1]).toBe(1);
			expect(addr[19]).toBe(19);
		});

		it("handles negative values as unsigned", () => {
			const addr = Address.of(
				-1,
				-2,
				-3,
				-4,
				-5,
				-6,
				-7,
				-8,
				-9,
				-10,
				-11,
				-12,
				-13,
				-14,
				-15,
				-16,
				-17,
				-18,
				-19,
				-20,
			);
			expect(addr[0]).toBe(255);
			expect(addr[1]).toBe(254);
		});

		it("handles very large values", () => {
			const addr = Address.of(
				1000,
				1001,
				1002,
				1003,
				1004,
				1005,
				1006,
				1007,
				1008,
				1009,
				1010,
				1011,
				1012,
				1013,
				1014,
				1015,
				1016,
				1017,
				1018,
				1019,
			);
			expect(addr[0]).toBe(1000 & 0xff);
			expect(addr[1]).toBe(1001 & 0xff);
		});
	});

	describe("comparison with fromBytes", () => {
		it("produces same result as fromBytes", () => {
			const bytes = new Uint8Array([
				0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8,
				0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf2, 0x51, 0xe3,
			]);
			const addr1 = Address.fromBytes(bytes);
			const addr2 = Address.of(
				0x74,
				0x2d,
				0x35,
				0xcc,
				0x66,
				0x34,
				0xc0,
				0x53,
				0x29,
				0x25,
				0xa3,
				0xb8,
				0x44,
				0xbc,
				0x9e,
				0x75,
				0x95,
				0xf2,
				0x51,
				0xe3,
			);
			expect(
				Address.equals(
					addr1 as import("./BrandedAddress.js").BrandedAddress,
					addr2 as import("./BrandedAddress.js").BrandedAddress,
				),
			).toBe(true);
		});
	});

	describe("integration", () => {
		it("works with Address factory", () => {
			const addr = Address.of(
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				16,
				17,
				18,
				19,
				20,
			);
			expect(addr[0]).toBe(1);
			expect(addr[19]).toBe(20);
		});

		it("works with Address namespace method", () => {
			const addr = Address.of(
				0x74,
				0x2d,
				0x35,
				0xcc,
				0x66,
				0x34,
				0xc0,
				0x53,
				0x29,
				0x25,
				0xa3,
				0xb8,
				0x44,
				0xbc,
				0x9e,
				0x75,
				0x95,
				0xf2,
				0x51,
				0xe3,
			);
			const hex = Address.toHex(
				addr as import("./BrandedAddress.js").BrandedAddress,
			);
			expect(hex).toBe("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
		});

		it("can be used with all Address methods", () => {
			const addr = Address.of(
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9,
				10,
				11,
				12,
				13,
				14,
				15,
				16,
				17,
				18,
				19,
				20,
			);
			expect(
				Address.isZero(addr as import("./BrandedAddress.js").BrandedAddress),
			).toBe(false);
			expect(
				Address.toHex(addr as import("./BrandedAddress.js").BrandedAddress),
			).toMatch(/^0x[0-9a-f]{40}$/);
			expect(
				Address.toChecksummed(
					addr as import("./BrandedAddress.js").BrandedAddress,
				),
			).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});

	describe("edge cases", () => {
		it("handles exactly 20 zeros", () => {
			const addr = Address.of(
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
			);
			expect(addr.length).toBe(20);
		});

		it("handles exactly 20 max values", () => {
			const addr = Address.of(
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
				255,
			);
			expect(addr.length).toBe(20);
		});
	});
});

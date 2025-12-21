import { describe, expect, it } from "vitest";
import { InvalidLengthError } from "../errors/index.js";
import { fromBytes } from "./fromBytes.js";

describe("PrivateKey.fromBytes", () => {
	describe("constructor tests", () => {
		it("creates PrivateKey from 32 bytes", () => {
			const bytes = new Uint8Array(32);
			const pk = fromBytes(bytes);

			expect(pk).toBeInstanceOf(Uint8Array);
			expect(pk.length).toBe(32);
		});

		it("creates PrivateKey from zero bytes", () => {
			const bytes = new Uint8Array(32);
			const pk = fromBytes(bytes);

			expect(pk.every((byte) => byte === 0)).toBe(true);
		});

		it("creates PrivateKey from max bytes", () => {
			const bytes = new Uint8Array(32).fill(0xff);
			const pk = fromBytes(bytes);

			expect(pk.every((byte) => byte === 0xff)).toBe(true);
		});

		it("creates PrivateKey from known test key", () => {
			const bytes = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);
			const pk = fromBytes(bytes);

			expect(pk.length).toBe(32);
			expect(pk[0]).toBe(0xac);
			expect(pk[31]).toBe(0x80);
		});

		it("creates new Uint8Array instance", () => {
			const bytes = new Uint8Array(32);
			const pk = fromBytes(bytes);

			expect(pk).not.toBe(bytes);
			bytes[0] = 0xff;
			expect(pk[0]).toBe(0);
		});

		it("preserves byte values", () => {
			const bytes = new Uint8Array([
				0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
				0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
				0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
			]);
			const pk = fromBytes(bytes);

			for (let i = 0; i < 32; i++) {
				expect(pk[i]).toBe(bytes[i]);
			}
		});
	});

	describe("validation tests", () => {
		it("accepts exactly 32 bytes", () => {
			const bytes = new Uint8Array(32);
			expect(() => fromBytes(bytes)).not.toThrow();
		});

		it("throws on 31 bytes", () => {
			const bytes = new Uint8Array(31);
			expect(() => fromBytes(bytes)).toThrow(InvalidLengthError);
		});

		it("throws on 33 bytes", () => {
			const bytes = new Uint8Array(33);
			expect(() => fromBytes(bytes)).toThrow(InvalidLengthError);
		});

		it("throws on 0 bytes", () => {
			const bytes = new Uint8Array(0);
			expect(() => fromBytes(bytes)).toThrow(InvalidLengthError);
		});

		it("throws on 16 bytes", () => {
			const bytes = new Uint8Array(16);
			expect(() => fromBytes(bytes)).toThrow(InvalidLengthError);
		});

		it("throws on 64 bytes", () => {
			const bytes = new Uint8Array(64);
			expect(() => fromBytes(bytes)).toThrow(InvalidLengthError);
		});

		it("error includes actual length", () => {
			const bytes = new Uint8Array(31);
			try {
				fromBytes(bytes);
				expect.fail("Should have thrown");
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.message).toContain("31");
				expect(error.message).toContain("32");
			}
		});

		it("error includes expected length", () => {
			const bytes = new Uint8Array(33);
			try {
				fromBytes(bytes);
				expect.fail("Should have thrown");
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.message).toContain("32 bytes");
			}
		});

		it("error has correct code", () => {
			const bytes = new Uint8Array(31);
			try {
				fromBytes(bytes);
				expect.fail("Should have thrown");
			} catch (e) { const error = /** @type {*} */ (e);
				expect(error.code).toBe("PRIVATE_KEY_INVALID_LENGTH");
			}
		});
	});

	describe("edge cases", () => {
		it("handles all zero bytes", () => {
			const bytes = new Uint8Array(32);
			const pk = fromBytes(bytes);

			expect(pk.every((b) => b === 0)).toBe(true);
		});

		it("handles all max bytes", () => {
			const bytes = new Uint8Array(32).fill(0xff);
			const pk = fromBytes(bytes);

			expect(pk.every((b) => b === 0xff)).toBe(true);
		});

		it("handles alternating pattern", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i % 2 === 0 ? 0xaa : 0x55;
			}
			const pk = fromBytes(bytes);

			for (let i = 0; i < 32; i++) {
				expect(pk[i]).toBe(i % 2 === 0 ? 0xaa : 0x55);
			}
		});

		it("handles sequential bytes", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i;
			}
			const pk = fromBytes(bytes);

			for (let i = 0; i < 32; i++) {
				expect(pk[i]).toBe(i);
			}
		});

		it("handles random-looking bytes", () => {
			const bytes = new Uint8Array([
				0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0xfe, 0xdc, 0xba, 0x98,
				0x76, 0x54, 0x32, 0x10, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
				0xff, 0xee, 0xdd, 0xcc, 0xbb, 0xaa, 0x99, 0x88,
			]);
			const pk = fromBytes(bytes);

			expect(pk[0]).toBe(0x12);
			expect(pk[15]).toBe(0x10);
			expect(pk[31]).toBe(0x88);
		});
	});

	describe("type tests", () => {
		it("returns Uint8Array", () => {
			const bytes = new Uint8Array(32);
			const pk = fromBytes(bytes);

			expect(pk).toBeInstanceOf(Uint8Array);
		});

		it("has correct length property", () => {
			const bytes = new Uint8Array(32);
			const pk = fromBytes(bytes);

			expect(pk.length).toBe(32);
		});

		it("supports array indexing", () => {
			const bytes = new Uint8Array(32).fill(0xab);
			const pk = fromBytes(bytes);

			expect(pk[0]).toBe(0xab);
			expect(pk[15]).toBe(0xab);
			expect(pk[31]).toBe(0xab);
		});

		it("supports iteration", () => {
			const bytes = new Uint8Array(32).fill(0xcd);
			const pk = fromBytes(bytes);

			let count = 0;
			for (const byte of pk) {
				expect(byte).toBe(0xcd);
				count++;
			}
			expect(count).toBe(32);
		});
	});

	describe("integration tests", () => {
		it("can be used with toHex", async () => {
			const bytes = new Uint8Array(32).fill(0xaa);
			const pk = fromBytes(bytes);
			const { toHex } = await import("./toHex.js");

			const hex = toHex.call(pk);
			expect(hex).toBe(
				"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			);
		});

		it("can be used with toPublicKey", async () => {
			const bytes = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);
			const pk = fromBytes(bytes);
			const { toPublicKey } = await import("./toPublicKey.js");

			const pubkey = toPublicKey.call(pk);
			expect(pubkey).toBeInstanceOf(Uint8Array);
			expect(pubkey.length).toBe(64);
		});

		it("can be used with toAddress", async () => {
			const bytes = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);
			const pk = fromBytes(bytes);
			const { toAddress } = await import("./toAddress.js");

			const address = toAddress.call(pk);
			expect(address).toBeInstanceOf(Uint8Array);
			expect(address.length).toBe(20);
		});
	});
});

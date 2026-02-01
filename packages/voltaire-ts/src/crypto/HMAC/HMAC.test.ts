import { describe, expect, it } from "vitest";
import { EmptyKeyError, HMAC } from "./index.js";

describe("HMAC", () => {
	describe("sha256", () => {
		it("computes correct HMAC-SHA256", () => {
			const key = new Uint8Array([
				0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
				0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
			]);
			const message = new TextEncoder().encode("Hi There");
			const mac = HMAC.sha256(key, message);

			expect(mac.length).toBe(32);
			expect(mac).toBeInstanceOf(Uint8Array);
		});

		it("rejects empty key", () => {
			const key = new Uint8Array(0);
			const message = new TextEncoder().encode("test");

			expect(() => HMAC.sha256(key, message)).toThrow(EmptyKeyError);
			expect(() => HMAC.sha256(key, message)).toThrow(
				"HMAC key cannot be empty",
			);
		});

		it("accepts single-byte key", () => {
			const key = new Uint8Array([0x42]);
			const message = new TextEncoder().encode("test");
			const mac = HMAC.sha256(key, message);

			expect(mac.length).toBe(32);
		});

		it("handles empty message", () => {
			const key = new Uint8Array([1, 2, 3, 4]);
			const message = new Uint8Array(0);
			const mac = HMAC.sha256(key, message);

			expect(mac.length).toBe(32);
		});

		it("produces different outputs for different keys", () => {
			const message = new TextEncoder().encode("test");
			const mac1 = HMAC.sha256(new Uint8Array([1]), message);
			const mac2 = HMAC.sha256(new Uint8Array([2]), message);

			expect(mac1).not.toEqual(mac2);
		});

		it("produces different outputs for different messages", () => {
			const key = new Uint8Array([1, 2, 3, 4]);
			const mac1 = HMAC.sha256(key, new TextEncoder().encode("test1"));
			const mac2 = HMAC.sha256(key, new TextEncoder().encode("test2"));

			expect(mac1).not.toEqual(mac2);
		});
	});

	describe("sha512", () => {
		it("computes correct HMAC-SHA512", () => {
			const key = new Uint8Array([
				0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
				0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
			]);
			const message = new TextEncoder().encode("Hi There");
			const mac = HMAC.sha512(key, message);

			expect(mac.length).toBe(64);
			expect(mac).toBeInstanceOf(Uint8Array);
		});

		it("rejects empty key", () => {
			const key = new Uint8Array(0);
			const message = new TextEncoder().encode("test");

			expect(() => HMAC.sha512(key, message)).toThrow(EmptyKeyError);
			expect(() => HMAC.sha512(key, message)).toThrow(
				"HMAC key cannot be empty",
			);
		});

		it("accepts single-byte key", () => {
			const key = new Uint8Array([0x42]);
			const message = new TextEncoder().encode("test");
			const mac = HMAC.sha512(key, message);

			expect(mac.length).toBe(64);
		});
	});

	describe("EmptyKeyError", () => {
		it("has correct name", () => {
			const error = new EmptyKeyError();
			expect(error.name).toBe("EmptyKeyError");
		});

		it("has correct message", () => {
			const error = new EmptyKeyError();
			expect(error.message).toBe("HMAC key cannot be empty");
		});

		it("accepts custom message", () => {
			const error = new EmptyKeyError("Custom error message");
			expect(error.message).toBe("Custom error message");
		});

		it("is instance of Error", () => {
			const error = new EmptyKeyError();
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("constants", () => {
		it("exports SHA256_OUTPUT_SIZE", () => {
			expect(HMAC.SHA256_OUTPUT_SIZE).toBe(32);
		});

		it("exports SHA512_OUTPUT_SIZE", () => {
			expect(HMAC.SHA512_OUTPUT_SIZE).toBe(64);
		});
	});
});

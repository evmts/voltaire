import { describe, expect, it } from "vitest";
import {
	setFromBase64Polyfill,
	setFromHexPolyfill,
	toBase64Polyfill,
	toHexPolyfill,
} from "./polyfills.js";

describe("Uint8Array polyfills", () => {
	describe("toHex", () => {
		it("converts empty array to 0x", () => {
			const arr = new Uint8Array([]);
			const hex = toHexPolyfill.call(arr);
			expect(hex).toBe("0x");
		});

		it("converts single byte", () => {
			const arr = new Uint8Array([0xff]);
			const hex = toHexPolyfill.call(arr);
			expect(hex).toBe("0xff");
		});

		it("converts multiple bytes", () => {
			const arr = new Uint8Array([0x12, 0x34, 0x56]);
			const hex = toHexPolyfill.call(arr);
			expect(hex).toBe("0x123456");
		});

		it("pads single digit bytes", () => {
			const arr = new Uint8Array([0x01, 0x02, 0x0f]);
			const hex = toHexPolyfill.call(arr);
			expect(hex).toBe("0x01020f");
		});

		it("converts 20 bytes (address)", () => {
			const arr = new Uint8Array(20);
			arr[0] = 0xa0;
			arr[19] = 0x1e;
			const hex = toHexPolyfill.call(arr);
			expect(hex).toMatch(/^0x[0-9a-f]{40}$/);
			expect(hex).toMatch(/^0xa0/);
			expect(hex).toMatch(/1e$/);
		});
	});

	describe("setFromHex", () => {
		it("sets from hex with 0x prefix", () => {
			const arr = new Uint8Array(3);
			setFromHexPolyfill.call(arr, "0x123456");
			expect(arr[0]).toBe(0x12);
			expect(arr[1]).toBe(0x34);
			expect(arr[2]).toBe(0x56);
		});

		it("sets from hex without 0x prefix", () => {
			const arr = new Uint8Array(3);
			setFromHexPolyfill.call(arr, "abcdef");
			expect(arr[0]).toBe(0xab);
			expect(arr[1]).toBe(0xcd);
			expect(arr[2]).toBe(0xef);
		});

		it("throws on odd length hex", () => {
			const arr = new Uint8Array(2);
			expect(() => {
				setFromHexPolyfill.call(arr, "0x123");
			}).toThrow();
		});

		it("throws on invalid hex characters", () => {
			const arr = new Uint8Array(2);
			expect(() => {
				setFromHexPolyfill.call(arr, "0x12zz");
			}).toThrow();
		});

		it("throws on buffer too small", () => {
			const arr = new Uint8Array(2);
			expect(() => {
				setFromHexPolyfill.call(arr, "0x123456");
			}).toThrow();
		});
	});

	describe("toBase64", () => {
		it("converts empty array", () => {
			const arr = new Uint8Array([]);
			const b64 = toBase64Polyfill.call(arr);
			expect(b64).toBe("");
		});

		it("converts single byte", () => {
			const arr = new Uint8Array([0xff]);
			const b64 = toBase64Polyfill.call(arr);
			expect(b64).toBe("/w==");
		});

		it("converts hello world", () => {
			const arr = new TextEncoder().encode("Hello");
			const b64 = toBase64Polyfill.call(arr);
			expect(b64).toBe("SGVsbG8=");
		});

		it("converts multiple bytes", () => {
			const arr = new Uint8Array([0x12, 0x34, 0x56]);
			const b64 = toBase64Polyfill.call(arr);
			// Verify it's valid base64
			expect(b64).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
		});
	});

	describe("setFromBase64", () => {
		it("sets from base64", () => {
			const arr = new Uint8Array(5);
			setFromBase64Polyfill.call(arr, "SGVsbG8=");
			const str = new TextDecoder().decode(arr);
			expect(str).toBe("Hello");
		});

		it("sets from base64 without padding", () => {
			const arr = new Uint8Array(2);
			setFromBase64Polyfill.call(arr, "/w==");
			expect(arr[0]).toBe(0xff);
		});

		it("throws on invalid base64", () => {
			const arr = new Uint8Array(10);
			expect(() => {
				setFromBase64Polyfill.call(arr, "invalid!@#$");
			}).toThrow();
		});

		it("throws on buffer too small", () => {
			const arr = new Uint8Array(2);
			expect(() => {
				setFromBase64Polyfill.call(arr, "SGVsbG8=");
			}).toThrow();
		});
	});
});

import { describe, expect, it } from "vitest";
import { Address } from "../index.js";
import { fromBase64 } from "./fromBase64.js";
import * as AddressNamespace from "./index.js";

describe("fromBase64", () => {
	describe("valid base64 address", () => {
		it("creates Address from valid base64 string", () => {
			// "0x742d35cc6634c0532925a3b844bc9e7595f251e3" as base64
			const addr = fromBase64("dC01zGY0wFMpJaO4RLyedZXyUeM=");
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
			expect(addr[0]).toBe(0x74);
			expect(addr[1]).toBe(0x2d);
		});

		it("creates Address from base64 with padding", () => {
			// 20 bytes = 27 base64 chars + 1 padding
			const addr = fromBase64("AAAAAAAAAAAAAAAAAAAAAAAAAAA=");
			expect(addr).toBeInstanceOf(Uint8Array);
			expect(addr.length).toBe(20);
			expect(Address.isZero(addr)).toBe(true);
		});

		it("handles different valid base64 addresses", () => {
			const testVectors = [
				"dC01zGY0wFMpJaO4RLyedZXyUeM=",
				"AAAAAAAAAAAAAAAAAAAAAAAAAAA=",
				"//////////////////////////8=",
			];
			for (const b64 of testVectors) {
				const addr = fromBase64(b64);
				expect(addr).toBeInstanceOf(Uint8Array);
				expect(addr.length).toBe(20);
			}
		});
	});

	describe("invalid base64", () => {
		it("throws on invalid base64 characters", () => {
			expect(() => fromBase64("invalid@chars!")).toThrow();
		});

		it("throws on invalid base64 format", () => {
			expect(() => fromBase64("not base64 at all")).toThrow();
		});

		it("throws on base64 with spaces", () => {
			expect(() => fromBase64("dC01 zGY0 wFMp")).toThrow();
		});
	});

	describe("invalid length", () => {
		it("throws when decoded length is not 20 bytes", () => {
			// 19 bytes encoded
			const short = "AAAAAAAAAAAAAAAAAAAAAA==";
			// This is actually 16 bytes, need longer string for 19 bytes
			const b64_19 = "AAAAAAAAAAAAAAAAAAAAAAA=";
			expect(() => fromBase64(b64_19)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws when base64 decodes to too short", () => {
			// 10 bytes encoded
			const short = "AAAAAAAAAA==";
			expect(() => fromBase64(short)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});

		it("throws when base64 decodes to too long", () => {
			// 32 bytes encoded
			const long = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
			expect(() => fromBase64(long)).toThrow(
				AddressNamespace.InvalidAddressLengthError,
			);
		});
	});

	describe("roundtrip encoding", () => {
		it("matches original bytes when roundtripped", () => {
			const originalHex = "0x742d35cc6634c0532925a3b844bc9e7595f251e3";
			const originalAddr = Address.fromHex(originalHex);
			const b64 = btoa(String.fromCharCode(...originalAddr));
			const decoded = fromBase64(b64);
			expect(Address.equals(originalAddr, decoded)).toBe(true);
		});
	});

	it("works with Address namespace method", () => {
		const addr = Address.fromBase64("dC01zGY0wFMpJaO4RLyedZXyUeM=");
		expect(addr).toBeInstanceOf(Uint8Array);
		expect(addr.length).toBe(20);
	});
});

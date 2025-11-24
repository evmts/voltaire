import { describe, expect, it } from "vitest";
import { fromBytes } from "./fromBytes.js";
import { fromHex } from "./fromHex.js";
import { toHex } from "./toHex.js";
import { toString } from "./toString.js";

describe("toString", () => {
	describe("conversion", () => {
		it("converts hash to hex string", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			const str = toString(hash);
			expect(str).toBe(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
		});

		it("converts zero hash", () => {
			const hash = fromBytes(new Uint8Array(32));
			const str = toString(hash);
			expect(str).toBe(
				"0x0000000000000000000000000000000000000000000000000000000000000000",
			);
		});

		it("converts all-ff hash", () => {
			const bytes = new Uint8Array(32);
			bytes.fill(0xff);
			const hash = fromBytes(bytes);
			const str = toString(hash);
			expect(str).toBe(
				"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
			);
		});
	});

	describe("equivalence to toHex", () => {
		it("produces same result as toHex", () => {
			const hash = fromHex(
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
			);
			expect(toString(hash)).toBe(toHex(hash));
		});

		it("produces same result for zero hash", () => {
			const hash = fromBytes(new Uint8Array(32));
			expect(toString(hash)).toBe(toHex(hash));
		});

		it("produces same result for random bytes", () => {
			const bytes = new Uint8Array(32);
			for (let i = 0; i < 32; i++) {
				bytes[i] = i * 7;
			}
			const hash = fromBytes(bytes);
			expect(toString(hash)).toBe(toHex(hash));
		});
	});

	describe("formatting", () => {
		it("always includes 0x prefix", () => {
			const hash = fromBytes(new Uint8Array(32));
			const str = toString(hash);
			expect(str.startsWith("0x")).toBe(true);
		});

		it("produces lowercase hex", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0xab;
			bytes[1] = 0xcd;
			bytes[2] = 0xef;
			const hash = fromBytes(bytes);
			const str = toString(hash);
			expect(str.slice(2, 8)).toBe("abcdef");
		});

		it("produces exactly 66 characters", () => {
			const hash = fromBytes(new Uint8Array(32));
			const str = toString(hash);
			expect(str.length).toBe(66);
		});

		it("pads zeros correctly", () => {
			const bytes = new Uint8Array(32);
			bytes[0] = 0x01;
			bytes[1] = 0x0a;
			const hash = fromBytes(bytes);
			const str = toString(hash);
			expect(str.slice(0, 8)).toBe("0x010a00");
		});
	});

	describe("roundtrip", () => {
		it("roundtrips through fromHex", () => {
			const original =
				"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
			const hash = fromHex(original);
			const str = toString(hash);
			expect(str).toBe(original);
		});
	});
});

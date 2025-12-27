import { describe, expect, it } from "vitest";
import { Hash } from "../../../primitives/Hash/index.js";
import * as Signature from "./index.js";

describe("Secp256k1.Signature.toBytes", () => {
	describe("conversion to bytes", () => {
		it("should convert signature to 65-byte array", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes.length).toBe(65);
		});

		it("should place r in first 32 bytes", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes.slice(0, 32).every((b) => b === 42)).toBe(true);
		});

		it("should place s in bytes 32-63", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes.slice(32, 64).every((b) => b === 99)).toBe(true);
		});

		it("should place v in byte 64", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes[64]).toBe(27);
		});

		it("should handle v=28", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 28 };

			const bytes = Signature.toBytes(sig);

			expect(bytes[64]).toBe(28);
		});

		it("should handle v=0 (recovery id format)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 0 };

			const bytes = Signature.toBytes(sig);

			expect(bytes[64]).toBe(0);
		});

		it("should handle v=1 (recovery id format)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 1 };

			const bytes = Signature.toBytes(sig);

			expect(bytes[64]).toBe(1);
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero r", () => {
			const r = Hash.from(new Uint8Array(32));
			const s = Hash.from(new Uint8Array(32).fill(1));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes.slice(0, 32).every((b) => b === 0)).toBe(true);
		});

		it("should handle all-zero s", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes.slice(32, 64).every((b) => b === 0)).toBe(true);
		});

		it("should handle max values for r and s", () => {
			const r = Hash.from(new Uint8Array(32).fill(0xff));
			const s = Hash.from(new Uint8Array(32).fill(0xff));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			expect(bytes.slice(0, 32).every((b) => b === 0xff)).toBe(true);
			expect(bytes.slice(32, 64).every((b) => b === 0xff)).toBe(true);
		});

		it("should handle EIP-155 v values", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 37 }; // Chain ID 1

			const bytes = Signature.toBytes(sig);

			expect(bytes[64]).toBe(37);
		});

		it("should handle large chain ID v values", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 309 }; // Chain ID 137 (Polygon)

			const bytes = Signature.toBytes(sig);

			expect(bytes[64]).toBe(309 % 256); // Truncated to byte
		});
	});

	describe("specific byte patterns", () => {
		it("should correctly encode sequential r values", () => {
			const r = Hash.from(new Uint8Array(32));
			for (let i = 0; i < 32; i++) {
				r[i] = i;
			}
			const s = Hash.from(new Uint8Array(32).fill(0));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			for (let i = 0; i < 32; i++) {
				expect(bytes[i]).toBe(i);
			}
		});

		it("should correctly encode sequential s values", () => {
			const r = Hash.from(new Uint8Array(32).fill(0));
			const s = Hash.from(new Uint8Array(32));
			for (let i = 0; i < 32; i++) {
				s[i] = 100 + i;
			}
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);

			for (let i = 0; i < 32; i++) {
				expect(bytes[32 + i]).toBe(100 + i);
			}
		});
	});

	describe("roundtrip with fromBytes", () => {
		it("should roundtrip correctly", () => {
			const original = {
				r: Hash.from(new Uint8Array(32).fill(7)),
				s: Hash.from(new Uint8Array(32).fill(13)),
				v: 27,
			};

			const bytes = Signature.toBytes(original);
			const reconstructed = Signature.fromBytes(bytes);

			expect(new Uint8Array(reconstructed.r)).toEqual(
				new Uint8Array(original.r),
			);
			expect(new Uint8Array(reconstructed.s)).toEqual(
				new Uint8Array(original.s),
			);
			expect(reconstructed.v).toBe(original.v);
		});

		it("should roundtrip with different v values", () => {
			const testCases = [0, 1, 27, 28, 37, 38];

			for (const v of testCases) {
				const original = {
					r: Hash.from(new Uint8Array(32).fill(1)),
					s: Hash.from(new Uint8Array(32).fill(2)),
					v,
				};

				const bytes = Signature.toBytes(original);
				const reconstructed = Signature.fromBytes(bytes);

				expect(reconstructed.v).toBe(v);
			}
		});
	});

	describe("immutability", () => {
		it("should not modify signature r", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };
			const rCopy = new Uint8Array(r);

			Signature.toBytes(sig);

			expect(new Uint8Array(r)).toEqual(rCopy);
		});

		it("should not modify signature s", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };
			const sCopy = new Uint8Array(s);

			Signature.toBytes(sig);

			expect(new Uint8Array(s)).toEqual(sCopy);
		});

		it("should create independent byte array", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 27 };

			const bytes = Signature.toBytes(sig);
			bytes[0] = 255;
			bytes[32] = 255;
			bytes[64] = 28;

			expect(r[0]).toBe(1);
			expect(s[0]).toBe(2);
			expect(sig.v).toBe(27);
		});
	});

	describe("determinism", () => {
		it("should produce same result for same input", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13));
			const sig = { r, s, v: 27 };

			const bytes1 = Signature.toBytes(sig);
			const bytes2 = Signature.toBytes(sig);

			expect(bytes1).toEqual(bytes2);
		});

		it("should produce different results for different signatures", () => {
			const sig1 = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 27,
			};
			const sig2 = {
				r: Hash.from(new Uint8Array(32).fill(3)),
				s: Hash.from(new Uint8Array(32).fill(4)),
				v: 28,
			};

			const bytes1 = Signature.toBytes(sig1);
			const bytes2 = Signature.toBytes(sig2);

			expect(bytes1).not.toEqual(bytes2);
		});
	});
});

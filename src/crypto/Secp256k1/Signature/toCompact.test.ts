import { describe, expect, it } from "vitest";
import { Hash } from "../../../primitives/Hash/index.js";
import * as Signature from "./index.js";

describe("Secp256k1.Signature.toCompact", () => {
	describe("conversion to compact format", () => {
		it("should convert signature to 64-byte array", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact).toBeInstanceOf(Uint8Array);
			expect(compact.length).toBe(64);
		});

		it("should place r in first 32 bytes", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact.slice(0, 32).every((b) => b === 42)).toBe(true);
		});

		it("should place s in bytes 32-63", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact.slice(32, 64).every((b) => b === 99)).toBe(true);
		});

		it("should not include v in compact format", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
		});

		it("should produce same compact for different v values", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13));
			const sig27 = { r, s, v: 27 };
			const sig28 = { r, s, v: 28 };

			const compact27 = Signature.toCompact(sig27);
			const compact28 = Signature.toCompact(sig28);

			expect(compact27).toEqual(compact28);
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero r", () => {
			const r = Hash.from(new Uint8Array(32));
			const s = Hash.from(new Uint8Array(32).fill(1));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact.slice(0, 32).every((b) => b === 0)).toBe(true);
		});

		it("should handle all-zero s", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact.slice(32, 64).every((b) => b === 0)).toBe(true);
		});

		it("should handle max values for r and s", () => {
			const r = Hash.from(new Uint8Array(32).fill(0xff));
			const s = Hash.from(new Uint8Array(32).fill(0xff));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			expect(compact.slice(0, 32).every((b) => b === 0xff)).toBe(true);
			expect(compact.slice(32, 64).every((b) => b === 0xff)).toBe(true);
		});

		it("should handle v=0", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 0 };

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
		});

		it("should handle EIP-155 v values", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 37 };

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
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

			const compact = Signature.toCompact(sig);

			for (let i = 0; i < 32; i++) {
				expect(compact[i]).toBe(i);
			}
		});

		it("should correctly encode sequential s values", () => {
			const r = Hash.from(new Uint8Array(32).fill(0));
			const s = Hash.from(new Uint8Array(32));
			for (let i = 0; i < 32; i++) {
				s[i] = 100 + i;
			}
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);

			for (let i = 0; i < 32; i++) {
				expect(compact[32 + i]).toBe(100 + i);
			}
		});
	});

	describe("roundtrip with fromCompact", () => {
		it("should roundtrip correctly (without v)", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13));
			const original = { r, s, v: 27 };

			const compact = Signature.toCompact(original);
			const reconstructed = Signature.fromCompact(compact, 27);

			expect(reconstructed.r).toEqual(original.r);
			expect(reconstructed.s).toEqual(original.s);
		});

		it("should lose v information in compact format", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const original = { r, s, v: 28 };

			const compact = Signature.toCompact(original);
			const reconstructed = Signature.fromCompact(compact, 27);

			expect(reconstructed.v).toBe(27); // Not 28
		});
	});

	describe("immutability", () => {
		it("should not modify signature r", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };
			const rCopy = new Uint8Array(r);

			Signature.toCompact(sig);

			expect(r).toEqual(rCopy);
		});

		it("should not modify signature s", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };
			const sCopy = new Uint8Array(s);

			Signature.toCompact(sig);

			expect(s).toEqual(sCopy);
		});

		it("should create independent byte array", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);
			compact[0] = 255;
			compact[32] = 255;

			expect(r[0]).toBe(1);
			expect(s[0]).toBe(2);
		});
	});

	describe("determinism", () => {
		it("should produce same result for same input", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13));
			const sig = { r, s, v: 27 };

			const compact1 = Signature.toCompact(sig);
			const compact2 = Signature.toCompact(sig);

			expect(compact1).toEqual(compact2);
		});

		it("should produce different results for different r", () => {
			const sig1 = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 27,
			};
			const sig2 = {
				r: Hash.from(new Uint8Array(32).fill(3)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 27,
			};

			const compact1 = Signature.toCompact(sig1);
			const compact2 = Signature.toCompact(sig2);

			expect(compact1).not.toEqual(compact2);
		});

		it("should produce different results for different s", () => {
			const sig1 = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 27,
			};
			const sig2 = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32).fill(4)),
				v: 27,
			};

			const compact1 = Signature.toCompact(sig1);
			const compact2 = Signature.toCompact(sig2);

			expect(compact1).not.toEqual(compact2);
		});
	});

	describe("comparison with toBytes", () => {
		it("should match first 64 bytes of toBytes", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13));
			const sig = { r, s, v: 27 };

			const compact = Signature.toCompact(sig);
			const bytes = Signature.toBytes(sig);

			expect(compact).toEqual(bytes.slice(0, 64));
		});
	});
});

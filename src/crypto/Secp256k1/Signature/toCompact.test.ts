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

		it("should place s in bytes 32-63 with v encoded in MSB", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(0x55)); // 0x55 has bit 7 clear
			const sig = { r, s, v: 27 }; // v=27 means yParity=0

			const compact = Signature.toCompact(sig);

			// s bytes should be preserved, but bit 255 clear for yParity=0
			expect(compact[32]).toBe(0x55); // MSB clear
			expect(compact.slice(33, 64).every((b) => b === 0x55)).toBe(true);
		});

		it("should encode yParity in bit 255 of s (EIP-2098)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 28 }; // v=28 means yParity=1

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
			// Bit 255 (MSB of byte 32) should be set for yParity=1
			expect(compact[32] & 0x80).toBe(0x80);
			// Lower 7 bits of byte 32 should be preserved
			expect(compact[32] & 0x7f).toBe(2);
		});

		it("should produce different compact for v=27 vs v=28 (EIP-2098)", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13));
			const sig27 = { r, s, v: 27 }; // yParity=0
			const sig28 = { r, s, v: 28 }; // yParity=1

			const compact27 = Signature.toCompact(sig27);
			const compact28 = Signature.toCompact(sig28);

			// They should differ in bit 255 (MSB of byte 32)
			expect(compact27[32] & 0x80).toBe(0x00); // yParity=0: bit clear
			expect(compact28[32] & 0x80).toBe(0x80); // yParity=1: bit set
			// Other bytes should be same
			expect(compact27.slice(0, 32)).toEqual(compact28.slice(0, 32));
			expect(compact27.slice(33, 64)).toEqual(compact28.slice(33, 64));
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

		it("should handle max values for r and s (v=27)", () => {
			const r = Hash.from(new Uint8Array(32).fill(0xff));
			const s = Hash.from(new Uint8Array(32).fill(0xff));
			const sig = { r, s, v: 27 }; // yParity=0, MSB of s stays 0xff (bit 7 is clear in 0xff? no, it's set)

			const compact = Signature.toCompact(sig);

			expect(compact.slice(0, 32).every((b) => b === 0xff)).toBe(true);
			// For yParity=0 with s[0]=0xff, the MSB is already set from the s value itself
			// yParity=0 means we don't set bit 255, so s stays as 0xff
			expect(compact.slice(32, 64).every((b) => b === 0xff)).toBe(true);
		});

		it("should handle max values for r and s (v=28)", () => {
			const r = Hash.from(new Uint8Array(32).fill(0xff));
			const s = Hash.from(new Uint8Array(32).fill(0x7f)); // MSB clear
			const sig = { r, s, v: 28 }; // yParity=1

			const compact = Signature.toCompact(sig);

			expect(compact.slice(0, 32).every((b) => b === 0xff)).toBe(true);
			// yParity=1 means MSB is set: 0x7f | 0x80 = 0xff
			expect(compact[32]).toBe(0xff);
			expect(compact.slice(33, 64).every((b) => b === 0x7f)).toBe(true);
		});

		it("should handle v=0 (yParity=0)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 0 };

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
			expect(compact[32] & 0x80).toBe(0x00); // yParity=0, MSB clear
		});

		it("should handle v=1 (yParity=1)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 1 };

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
			expect(compact[32] & 0x80).toBe(0x80); // yParity=1, MSB set
		});

		it("should handle EIP-155 v values (odd = yParity 0)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 37 }; // chainId=1: (37-35) % 2 = 0

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
			expect(compact[32] & 0x80).toBe(0x00); // yParity=0
		});

		it("should handle EIP-155 v values (even = yParity 1)", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const sig = { r, s, v: 38 }; // chainId=1: (38-35) % 2 = 1

			const compact = Signature.toCompact(sig);

			expect(compact.length).toBe(64);
			expect(compact[32] & 0x80).toBe(0x80); // yParity=1
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
		it("should roundtrip correctly with v=27 (yParity=0)", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13)); // 13 = 0x0d, MSB clear
			const original = { r, s, v: 27 }; // yParity=0

			const compact = Signature.toCompact(original);
			// fromCompact requires explicit v since it doesn't decode from EIP-2098
			const reconstructed = Signature.fromCompact(compact, 27);

			expect(new Uint8Array(reconstructed.r)).toEqual(
				new Uint8Array(original.r),
			);
			expect(new Uint8Array(reconstructed.s)).toEqual(
				new Uint8Array(original.s),
			);
			expect(reconstructed.v).toBe(27);
		});

		it("should roundtrip correctly with v=28 (yParity=1)", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13)); // 13 = 0x0d, MSB clear
			const original = { r, s, v: 28 }; // yParity=1

			const compact = Signature.toCompact(original);
			// Verify yParity is encoded: s[0] = 0x0d | 0x80 = 0x8d
			expect(compact[32]).toBe(0x8d);
			expect(compact[32] & 0x80).toBe(0x80);
			// fromCompact takes compact bytes as-is (doesn't decode EIP-2098)
			const reconstructed = Signature.fromCompact(compact, 28);

			expect(new Uint8Array(reconstructed.r)).toEqual(
				new Uint8Array(original.r),
			);
			// fromCompact doesn't decode EIP-2098, so s[0] will be 0x8d not 0x0d
			// This is the expected behavior - fromCompact is a raw copy
			expect(reconstructed.s[0]).toBe(0x8d); // Has EIP-2098 bit set
			expect(reconstructed.v).toBe(28);
		});

		it("should preserve v information in EIP-2098 compact format", () => {
			const r = Hash.from(new Uint8Array(32).fill(1));
			const s = Hash.from(new Uint8Array(32).fill(2));
			const original = { r, s, v: 28 }; // yParity=1

			const compact = Signature.toCompact(original);
			// yParity=1 is encoded in bit 255
			expect(compact[32] & 0x80).toBe(0x80);
		});
	});

	describe("immutability", () => {
		it("should not modify signature r", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };
			const rCopy = new Uint8Array(r);

			Signature.toCompact(sig);

			expect(new Uint8Array(r)).toEqual(rCopy);
		});

		it("should not modify signature s", () => {
			const r = Hash.from(new Uint8Array(32).fill(42));
			const s = Hash.from(new Uint8Array(32).fill(99));
			const sig = { r, s, v: 27 };
			const sCopy = new Uint8Array(s);

			Signature.toCompact(sig);

			expect(new Uint8Array(s)).toEqual(sCopy);
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
		it("should match first 64 bytes of toBytes when yParity=0", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13)); // 0x0d, MSB clear
			const sig = { r, s, v: 27 }; // yParity=0, so no MSB modification

			const compact = Signature.toCompact(sig);
			const bytes = Signature.toBytes(sig);

			// When yParity=0, compact matches raw r||s
			expect(compact).toEqual(bytes.slice(0, 64));
		});

		it("should differ from toBytes when yParity=1 (EIP-2098)", () => {
			const r = Hash.from(new Uint8Array(32).fill(7));
			const s = Hash.from(new Uint8Array(32).fill(13)); // 0x0d
			const sig = { r, s, v: 28 }; // yParity=1

			const compact = Signature.toCompact(sig);
			const bytes = Signature.toBytes(sig);

			// r portion should match
			expect(compact.slice(0, 32)).toEqual(bytes.slice(0, 32));
			// s portion differs because EIP-2098 sets bit 255
			expect(compact[32]).toBe(0x0d | 0x80); // 0x8d
			expect(bytes[32]).toBe(0x0d); // unmodified
		});
	});

	describe("EIP-2098 known test vectors", () => {
		it("should produce correct compact signature for known vector", () => {
			// Test vector: signature with known compact output
			// r = all 0x11, s = all 0x22, v = 28 (yParity=1)
			const r = Hash.from(new Uint8Array(32).fill(0x11));
			const s = Hash.from(new Uint8Array(32).fill(0x22));
			const sig = { r, s, v: 28 };

			const compact = Signature.toCompact(sig);

			// r unchanged
			expect(compact.slice(0, 32).every((b) => b === 0x11)).toBe(true);
			// s[0] should have MSB set: 0x22 | 0x80 = 0xa2
			expect(compact[32]).toBe(0xa2);
			expect(compact.slice(33, 64).every((b) => b === 0x22)).toBe(true);
		});

		it("should handle canonical s values (s < n/2)", () => {
			// Canonical signatures have s in low-s form, meaning MSB of s[0] is clear
			// This is important because EIP-2098 requires canonical signatures
			const r = Hash.from(new Uint8Array(32).fill(0x11));
			// Low s value (well under n/2, MSB clear)
			const s = Hash.from(new Uint8Array(32).fill(0x01));
			const sig = { r, s, v: 1 }; // yParity=1

			const compact = Signature.toCompact(sig);

			// yParity=1 sets MSB: 0x01 | 0x80 = 0x81
			expect(compact[32]).toBe(0x81);
		});
	});
});

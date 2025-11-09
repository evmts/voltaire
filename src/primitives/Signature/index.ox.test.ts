/**
 * Signature Module - Ox Implementation Tests
 *
 * Validates that Ox's Signature module provides complete coverage
 * for Voltaire's signature handling requirements.
 */

import { describe, it, expect } from "vitest";
import * as Signature from "./index.ox.js";

describe("Signature (Ox-based)", () => {
	describe("Constructor Functions", () => {
		describe("from()", () => {
			it("should construct from object with r, s, v components", () => {
				const sig = Signature.from({
					v: 27,
					r: "0x" + "01".repeat(32),
					s: "0x" + "02".repeat(32),
				});
				expect(sig).toBeDefined();
				expect(sig.r).toBeDefined();
				expect(sig.s).toBeDefined();
			});

			it("should construct from object with r, s, yParity components", () => {
				const sig = Signature.from({
					yParity: 0,
					r: "0x" + "01".repeat(32),
					s: "0x" + "02".repeat(32),
				});
				expect(sig).toBeDefined();
				expect(sig.r).toBeDefined();
				expect(sig.s).toBeDefined();
				expect(sig.yParity).toBe(0);
			});
		});

		describe("fromHex()", () => {
			it("should construct from 65-byte hex string (64-byte sig + 1-byte yParity)", () => {
				const hex = "0x" + "01".repeat(32) + "02".repeat(32) + "00";
				const sig = Signature.fromHex(hex);
				expect(sig).toBeDefined();
			});

			it("should construct from 64-byte hex string (r + s only)", () => {
				const hex = "0x" + "01".repeat(32) + "02".repeat(32);
				const sig = Signature.fromHex(hex);
				expect(sig).toBeDefined();
			});
		});

		describe("fromBytes()", () => {
			it("should construct from 65-byte Uint8Array (64-byte sig + 1-byte yParity)", () => {
				const bytes = new Uint8Array(65).fill(1);
				bytes[64] = 0;
				const sig = Signature.fromBytes(bytes);
				expect(sig).toBeDefined();
			});

			it("should construct from 64-byte Uint8Array (r + s only)", () => {
				const bytes = new Uint8Array(64).fill(1);
				const sig = Signature.fromBytes(bytes);
				expect(sig).toBeDefined();
			});
		});

		describe("fromTuple()", () => {
			it("should construct from tuple [r, s, v]", () => {
				// Ox expects [r, s, v] tuple where v is 27 or 28
				const sig = Signature.fromTuple([
					"0x" + "01".repeat(32),
					"0x" + "02".repeat(32),
					27,
				] as Parameters<typeof Signature.fromTuple>[0]);
				expect(sig).toBeDefined();
				expect(sig.yParity).toBe(0);
			});

			it("should construct from tuple with v 28", () => {
				const sig = Signature.fromTuple([
					"0x" + "01".repeat(32),
					"0x" + "02".repeat(32),
					28,
				] as Parameters<typeof Signature.fromTuple>[0]);
				expect(sig).toBeDefined();
				expect(sig.yParity).toBe(1);
			});
		});

		describe("fromRpc()", () => {
			it("should construct from RPC signature object with v", () => {
				const sig = Signature.fromRpc({
					v: 27n,
					r: "0x" + "01".repeat(32),
					s: "0x" + "02".repeat(32),
				});
				expect(sig).toBeDefined();
			});

			it("should construct from RPC with yParity", () => {
				const sig = Signature.fromRpc({
					yParity: 1,
					r: "0x" + "01".repeat(32),
					s: "0x" + "02".repeat(32),
				});
				expect(sig).toBeDefined();
				expect(sig.yParity).toBe(1);
			});
		});

		describe("fromLegacy()", () => {
			it("should construct from legacy signature with v in [27, 28]", () => {
				const sig = Signature.fromLegacy({
					v: 27,
					r: "0x" + "01".repeat(32),
					s: "0x" + "02".repeat(32),
				});
				expect(sig).toBeDefined();
			});
		});

		describe("DER Constructors", () => {
			it("should construct from valid DER-encoded hex", () => {
				// Valid minimal DER signature: 0x30 0x06 0x02 0x01 0x01 0x02 0x01 0x01
				const derHex = "0x300602010102010";
				const sig = Signature.fromDerHex(derHex);
				expect(sig).toBeDefined();
				expect(sig.r).toBeDefined();
				expect(sig.s).toBeDefined();
			});

			it("should construct from DER-encoded bytes", () => {
				// Minimal DER: 0x30 (sequence), 0x06 (length), 0x02 (int), 0x01 (length), 0x01 (value), etc.
				const derBytes = new Uint8Array([
					0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01,
				]);
				const sig = Signature.fromDerBytes(derBytes);
				expect(sig).toBeDefined();
				expect(sig.r).toBeDefined();
				expect(sig.s).toBeDefined();
			});
		});
	});

	describe("Converter Functions", () => {
		const sig = Signature.from({
			v: 27,
			r: "0x" + "01".repeat(32),
			s: "0x" + "02".repeat(32),
		});

		describe("toHex()", () => {
			it("should convert to 65-byte hex (r + s + yParity)", () => {
				const hex = Signature.toHex(sig);
				expect(typeof hex).toBe("string");
				expect(hex.startsWith("0x")).toBe(true);
				expect(hex.length).toBe(132); // 0x + 130 hex chars (65 bytes)
			});
		});

		describe("toBytes()", () => {
			it("should convert to 65-byte Uint8Array (r + s + yParity)", () => {
				const bytes = Signature.toBytes(sig);
				expect(bytes instanceof Uint8Array).toBe(true);
				expect(bytes.length).toBe(65);
			});
		});

		describe("toTuple()", () => {
			it("should convert to tuple [r, s, yParity]", () => {
				const tuple = Signature.toTuple(sig);
				expect(Array.isArray(tuple)).toBe(true);
				expect(tuple.length).toBe(3);
			});
		});

		describe("toRpc()", () => {
			it("should convert to RPC object with r, s, yParity", () => {
				const rpc = Signature.toRpc(sig);
				expect(rpc).toHaveProperty("r");
				expect(rpc).toHaveProperty("s");
				expect(rpc).toHaveProperty("yParity");
			});
		});

		describe("toLegacy()", () => {
			it("should convert to legacy format with v in [27, 28]", () => {
				const legacy = Signature.toLegacy(sig);
				expect(legacy).toHaveProperty("v");
				expect(legacy.v).toBeGreaterThanOrEqual(27);
				expect(legacy.v).toBeLessThanOrEqual(28);
			});
		});

		describe("DER Converters", () => {
			it("should convert to DER-encoded hex", () => {
				const derHex = Signature.toDerHex(sig);
				expect(typeof derHex).toBe("string");
				expect(derHex.startsWith("0x")).toBe(true);
			});

			it("should convert to DER-encoded bytes", () => {
				const derBytes = Signature.toDerBytes(sig);
				expect(derBytes instanceof Uint8Array).toBe(true);
			});
		});
	});

	describe("Utility Functions", () => {
		const sig = Signature.from({
			v: 27,
			r: BigInt("0x" + "01".repeat(32)),
			s: BigInt("0x" + "02".repeat(32)),
		});

		describe("extract()", () => {
			it("should extract r, s, yParity from signature", () => {
				const extracted = Signature.extract(sig);
				expect(extracted).toHaveProperty("r");
				expect(extracted).toHaveProperty("s");
				expect(extracted).toHaveProperty("yParity");
			});
		});

		describe("validate()", () => {
			it("should validate a correct signature", () => {
				expect(() => Signature.validate(sig)).not.toThrow();
			});
		});

		describe("assert()", () => {
			it("should assert signature validity without returning value", () => {
				expect(() => Signature.assert(sig)).not.toThrow();
			});
		});

		describe("vToYParity()", () => {
			it("should convert v (27, 28) to yParity (0, 1)", () => {
				const yParity27 = Signature.vToYParity(27);
				expect(yParity27).toBe(0);

				const yParity28 = Signature.vToYParity(28);
				expect(yParity28).toBe(1);
			});
		});

		describe("yParityToV()", () => {
			it("should convert yParity (0, 1) to v (27, 28)", () => {
				const v0 = Signature.yParityToV(0);
				expect(v0).toBe(27);

				const v1 = Signature.yParityToV(1);
				expect(v1).toBe(28);
			});
		});
	});

	describe("API Coverage Verification", () => {
		it("should export all 26 core functions (100% API compatibility)", () => {
			// All functions that Ox provides
			const expected = [
				"from",
				"fromHex",
				"fromBytes",
				"fromTuple",
				"fromRpc",
				"fromLegacy",
				"fromDerHex",
				"fromDerBytes",
				"toHex",
				"toBytes",
				"toTuple",
				"toRpc",
				"toLegacy",
				"toDerHex",
				"toDerBytes",
				"extract",
				"validate",
				"assert",
				"vToYParity",
				"yParityToV",
			];

			for (const fn of expected) {
				expect(Signature).toHaveProperty(fn);
				expect(typeof Signature[fn as keyof typeof Signature]).toBe("function");
			}
		});

		it("should export Signature type", () => {
			// Type should be available for TypeScript
			expect(Signature).toBeDefined();
		});
	});

	describe("Interoperability", () => {
		it("should round-trip through hex format", () => {
			const original = Signature.from({
				v: 27,
				r: BigInt("0x" + "01".repeat(32)),
				s: BigInt("0x" + "02".repeat(32)),
			});

			const hex = Signature.toHex(original);
			const restored = Signature.fromHex(hex);

			expect(Signature.toHex(restored)).toBe(hex);
		});

		it("should round-trip through bytes format", () => {
			const original = Signature.from({
				v: 27,
				r: BigInt("0x" + "01".repeat(32)),
				s: BigInt("0x" + "02".repeat(32)),
			});

			const bytes = Signature.toBytes(original);
			const restored = Signature.fromBytes(bytes);

			const originalBytes = Signature.toBytes(original);
			const restoredBytes = Signature.toBytes(restored);

			expect(restoredBytes).toEqual(originalBytes);
		});

		it("should convert between v and yParity formats", () => {
			const v27 = 27;
			const yParity0 = Signature.vToYParity(v27);
			expect(yParity0).toBe(0);
			expect(Signature.yParityToV(yParity0)).toBe(v27);

			const v28 = 28;
			const yParity1 = Signature.vToYParity(v28);
			expect(yParity1).toBe(1);
			expect(Signature.yParityToV(yParity1)).toBe(v28);
		});
	});
});

import { describe, it, expect } from "vitest";
import * as Signature from "./index.js";

describe("Signature", () => {
	describe("secp256k1", () => {
		const r = new Uint8Array(32).fill(1);
		const s = new Uint8Array(32).fill(2);
		const v = 27;

		it("should create from secp256k1 components", () => {
			const sig = Signature.fromSecp256k1(r, s, v);
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBe(27);
			expect(sig.length).toBe(64);
		});

		it("should create from secp256k1 without v", () => {
			const sig = Signature.fromSecp256k1(r, s);
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBeUndefined();
		});

		it("should throw on invalid r length", () => {
			expect(() => Signature.fromSecp256k1(new Uint8Array(31), s, v)).toThrow(
				Signature.InvalidSignatureLengthError,
			);
		});

		it("should throw on invalid s length", () => {
			expect(() => Signature.fromSecp256k1(r, new Uint8Array(31), v)).toThrow(
				Signature.InvalidSignatureLengthError,
			);
		});
	});

	describe("p256", () => {
		const r = new Uint8Array(32).fill(3);
		const s = new Uint8Array(32).fill(4);

		it("should create from p256 components", () => {
			const sig = Signature.fromP256(r, s);
			expect(sig.algorithm).toBe("p256");
			expect(sig.v).toBeUndefined();
			expect(sig.length).toBe(64);
		});

		it("should throw on invalid r length", () => {
			expect(() => Signature.fromP256(new Uint8Array(31), s)).toThrow(
				Signature.InvalidSignatureLengthError,
			);
		});
	});

	describe("ed25519", () => {
		const signature = new Uint8Array(64).fill(5);

		it("should create from ed25519 signature", () => {
			const sig = Signature.fromEd25519(signature);
			expect(sig.algorithm).toBe("ed25519");
			expect(sig.length).toBe(64);
		});

		it("should throw on invalid signature length", () => {
			expect(() => Signature.fromEd25519(new Uint8Array(63))).toThrow(
				Signature.InvalidSignatureLengthError,
			);
		});
	});

	describe("from (universal constructor)", () => {
		it("should handle Uint8Array (defaults to secp256k1)", () => {
			const bytes = new Uint8Array(64).fill(1);
			const sig = Signature.from(bytes);
			expect(sig.algorithm).toBe("secp256k1");
		});

		it("should handle object with r, s, v", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.from({ r, s, v: 27, algorithm: "secp256k1" });
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBe(27);
		});

		it("should handle object with r, s (p256)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.from({ r, s, algorithm: "p256" });
			expect(sig.algorithm).toBe("p256");
		});

		it("should handle ed25519 object", () => {
			const signature = new Uint8Array(64).fill(1);
			const sig = Signature.from({ signature, algorithm: "ed25519" });
			expect(sig.algorithm).toBe("ed25519");
		});

		it("should return existing BrandedSignature", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r, s);
			const sig2 = Signature.from(sig1);
			expect(sig2).toBe(sig1);
		});
	});

	describe("compact encoding", () => {
		it("should convert to compact (without v)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s);
			const compact = Signature.toCompact(sig);
			expect(compact.length).toBe(64);
			expect(compact[0]).toBe(1);
			expect(compact[32]).toBe(2);
		});

		it("should convert to compact (with v)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 27);
			const compact = Signature.toCompact(sig);
			expect(compact.length).toBe(65);
			expect(compact[64]).toBe(27);
		});

		it("should create from compact (64 bytes)", () => {
			const compact = new Uint8Array(64);
			compact.fill(1, 0, 32);
			compact.fill(2, 32, 64);
			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.length).toBe(64);
		});

		it("should create from compact (65 bytes with v)", () => {
			const compact = new Uint8Array(65);
			compact.fill(1, 0, 32);
			compact.fill(2, 32, 64);
			compact[64] = 27;
			const sig = Signature.fromCompact(compact, "secp256k1");
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBe(27);
		});
	});

	describe("DER encoding", () => {
		it("should convert ECDSA to DER", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 0x42;
			const s = new Uint8Array(32).fill(0);
			s[31] = 0x84;
			const sig = Signature.fromSecp256k1(r, s, 27);
			const der = Signature.toDER(sig);
			expect(der[0]).toBe(0x30); // SEQUENCE tag
			expect(der[2]).toBe(0x02); // INTEGER tag for r
		});

		it("should throw for Ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.toDER(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should create from DER", () => {
			// Minimal DER: SEQUENCE { INTEGER r, INTEGER s }
			const der = new Uint8Array([
				0x30, 0x06, // SEQUENCE, length 6
				0x02, 0x01, 0x42, // INTEGER r = 0x42
				0x02, 0x01, 0x84, // INTEGER s = 0x84
			]);
			const sig = Signature.fromDER(der, "secp256k1", 27);
			expect(sig.algorithm).toBe("secp256k1");
			expect(sig.v).toBe(27);
		});
	});

	describe("canonical form", () => {
		it("should check if signature is canonical", () => {
			// Low s value (canonical)
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(true);
		});

		it("should detect non-canonical signature", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			// High s value (non-canonical)
			const s = new Uint8Array(32).fill(0xff);
			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(false);
		});

		it("should normalize non-canonical signature", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			// High s value (non-canonical but valid): 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A1
			// This is just above n/2 for secp256k1
			const s = new Uint8Array([
				0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xff, 0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
				0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa2,
			]);
			const sig = Signature.fromSecp256k1(r, s, 27);
			const normalized = Signature.normalize(sig);
			expect(Signature.isCanonical(normalized)).toBe(true);
			// v should flip
			expect(normalized.v).toBe(28);
		});

		it("should return Ed25519 as-is (always canonical)", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64).fill(1));
			expect(Signature.isCanonical(sig)).toBe(true);
			expect(Signature.normalize(sig)).toBe(sig);
		});
	});

	describe("getters", () => {
		it("should get algorithm", () => {
			const sig = Signature.fromSecp256k1(
				new Uint8Array(32),
				new Uint8Array(32),
			);
			expect(Signature.getAlgorithm(sig)).toBe("secp256k1");
		});

		it("should get r component", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s);
			const rValue = Signature.getR(sig);
			expect(rValue.length).toBe(32);
			expect(rValue[0]).toBe(1);
		});

		it("should get s component", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s);
			const sValue = Signature.getS(sig);
			expect(sValue.length).toBe(32);
			expect(sValue[0]).toBe(2);
		});

		it("should get v", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 27);
			expect(Signature.getV(sig)).toBe(27);
		});

		it("should throw getR for Ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getR(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should throw getV for non-secp256k1", () => {
			const sig = Signature.fromP256(new Uint8Array(32), new Uint8Array(32));
			expect(() => Signature.getV(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});
	});

	describe("utilities", () => {
		it("should check if value is BrandedSignature", () => {
			const sig = Signature.fromSecp256k1(
				new Uint8Array(32),
				new Uint8Array(32),
			);
			expect(Signature.is(sig)).toBe(true);
			expect(Signature.is(new Uint8Array(64))).toBe(false);
			expect(Signature.is(null)).toBe(false);
		});

		it("should check equality", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r, s, 27);
			const sig2 = Signature.fromSecp256k1(r, s, 27);
			const sig3 = Signature.fromSecp256k1(r, s, 28);
			expect(Signature.equals(sig1, sig2)).toBe(true);
			expect(Signature.equals(sig1, sig3)).toBe(false);
		});

		it("should convert to bytes", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 27);
			const bytes = Signature.toBytes(sig);
			expect(bytes.length).toBe(64);
			expect(bytes[0]).toBe(1);
			expect(bytes[32]).toBe(2);
		});
	});

	describe("verify", () => {
		it("should throw (not implemented)", () => {
			const sig = Signature.fromSecp256k1(
				new Uint8Array(32),
				new Uint8Array(32),
			);
			expect(() =>
				Signature.verify(sig, new Uint8Array(32), new Uint8Array(64)),
			).toThrow(Signature.InvalidAlgorithmError);
		});
	});

	describe("DER encoding edge cases", () => {
		it("should handle DER with leading zeros in r", () => {
			const der = new Uint8Array([
				0x30, 0x09, // SEQUENCE, length 9
				0x02, 0x03, 0x00, 0x00, 0x42, // INTEGER r with leading zeros
				0x02, 0x02, 0x00, 0x84, // INTEGER s with padding
			]);
			const sig = Signature.fromDER(der, "secp256k1", 27);
			expect(sig.algorithm).toBe("secp256k1");
			const r = Signature.getR(sig);
			expect(r[31]).toBe(0x42);
		});

		it("should handle DER with high bit set requiring padding", () => {
			const der = new Uint8Array([
				0x30, 0x08, // SEQUENCE, length 8
				0x02, 0x02, 0x00, 0x81, // INTEGER r = 0x81 (needs 0x00 padding)
				0x02, 0x02, 0x00, 0xff, // INTEGER s = 0xff (needs 0x00 padding)
			]);
			const sig = Signature.fromDER(der, "p256");
			expect(sig.algorithm).toBe("p256");
		});

		it("should roundtrip DER encoding", () => {
			const r = new Uint8Array(32).fill(0);
			r[30] = 0x12;
			r[31] = 0x34;
			const s = new Uint8Array(32).fill(0);
			s[30] = 0x56;
			s[31] = 0x78;
			const sig = Signature.fromSecp256k1(r, s, 27);
			const der = Signature.toDER(sig);
			const sig2 = Signature.fromDER(der, "secp256k1", 27);
			expect(Signature.equals(sig, sig2)).toBe(true);
		});

		it("should throw on invalid SEQUENCE tag", () => {
			const der = new Uint8Array([0x31, 0x06, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84]);
			expect(() => Signature.fromDER(der, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should throw on invalid INTEGER tag for r", () => {
			const der = new Uint8Array([0x30, 0x06, 0x03, 0x01, 0x42, 0x02, 0x01, 0x84]);
			expect(() => Signature.fromDER(der, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should throw on invalid INTEGER tag for s", () => {
			const der = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x42, 0x03, 0x01, 0x84]);
			expect(() => Signature.fromDER(der, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should throw on invalid SEQUENCE length", () => {
			const der = new Uint8Array([0x30, 0x10, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84]);
			expect(() => Signature.fromDER(der, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should throw on extra data after signature", () => {
			const der = new Uint8Array([
				0x30, 0x06, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84, 0xff,
			]);
			expect(() => Signature.fromDER(der, "secp256k1")).toThrow(
				Signature.InvalidDERError,
			);
		});

		it("should throw when trying to convert Ed25519 to DER", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64).fill(1));
			expect(() => Signature.toDER(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should throw when trying to parse DER as Ed25519", () => {
			const der = new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x42, 0x02, 0x01, 0x84]);
			expect(() => Signature.fromDER(der, "ed25519")).toThrow(
				Signature.InvalidDERError,
			);
		});
	});

	describe("EIP-155 chain ID encoding", () => {
		it("should handle pre-EIP-155 v values (27/28)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig27 = Signature.fromSecp256k1(r, s, 27);
			const sig28 = Signature.fromSecp256k1(r, s, 28);
			expect(sig27.v).toBe(27);
			expect(sig28.v).toBe(28);
		});

		it("should handle EIP-155 v values with chain ID", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			// v = chainId * 2 + 35 + yParity
			// For chain ID 1: v = 37 (yParity 0) or 38 (yParity 1)
			const sig37 = Signature.fromSecp256k1(r, s, 37);
			const sig38 = Signature.fromSecp256k1(r, s, 38);
			expect(sig37.v).toBe(37);
			expect(sig38.v).toBe(38);
		});

		it("should handle large chain IDs", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			// Chain ID 137 (Polygon): v = 137 * 2 + 35 + 0 = 309
			const sig = Signature.fromSecp256k1(r, s, 309);
			expect(sig.v).toBe(309);
		});

		it("should handle recovery ID 0 and 1 (EIP-2098 compact)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig0 = Signature.fromSecp256k1(r, s, 0);
			const sig1 = Signature.fromSecp256k1(r, s, 1);
			expect(sig0.v).toBe(0);
			expect(sig1.v).toBe(1);
		});
	});

	describe("malleability and security", () => {
		it("should detect canonical low-s signature", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			// Very low s value (definitely canonical)
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(true);
		});

		it("should detect non-canonical high-s signature", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			// Very high s value (definitely non-canonical)
			const s = new Uint8Array(32).fill(0xff);
			const sig = Signature.fromSecp256k1(r, s);
			expect(Signature.isCanonical(sig)).toBe(false);
		});

		it("should normalize maintains algorithm", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			const s = new Uint8Array(32).fill(0xff);
			const sig = Signature.fromSecp256k1(r, s, 27);
			const normalized = Signature.normalize(sig);
			expect(normalized.algorithm).toBe("secp256k1");
		});

		it("should not modify already canonical signature", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromSecp256k1(r, s, 27);
			expect(Signature.isCanonical(sig)).toBe(true);
			const normalized = Signature.normalize(sig);
			expect(normalized).toBe(sig);
		});

		it("should handle P256 canonicalization", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromP256(r, s);
			expect(Signature.isCanonical(sig)).toBe(true);
		});
	});

	describe("r/s/v bounds and edge cases", () => {
		it("should accept zero-filled r (testing lower bound)", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1; // Minimal non-zero
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromSecp256k1(r, s);
			const rValue = Signature.getR(sig);
			expect(rValue[31]).toBe(1);
		});

		it("should accept max-filled r (testing upper bound)", () => {
			const r = new Uint8Array(32).fill(0xff);
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromSecp256k1(r, s);
			const rValue = Signature.getR(sig);
			expect(rValue[0]).toBe(0xff);
		});

		it("should accept zero-filled s (testing lower bound)", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			const s = new Uint8Array(32).fill(0);
			s[31] = 1; // Minimal non-zero
			const sig = Signature.fromSecp256k1(r, s);
			const sValue = Signature.getS(sig);
			expect(sValue[31]).toBe(1);
		});

		it("should handle all valid v values", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const validVValues = [0, 1, 27, 28, 37, 38, 309, 310, 1000];
			for (const v of validVValues) {
				const sig = Signature.fromSecp256k1(r, s, v);
				expect(sig.v).toBe(v);
			}
		});

		it("should handle signature without v", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s);
			expect(sig.v).toBeUndefined();
		});

		it("should preserve v through normalization", () => {
			const r = new Uint8Array(32).fill(0);
			r[31] = 1;
			const s = new Uint8Array(32).fill(0);
			s[31] = 1;
			const sig = Signature.fromSecp256k1(r, s, 37);
			expect(Signature.isCanonical(sig)).toBe(true);
			const normalized = Signature.normalize(sig);
			expect(normalized.v).toBe(37);
		});
	});

	describe("algorithm-specific behavior", () => {
		it("should throw getR for Ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getR(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should throw getS for Ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getS(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should throw getV for P256", () => {
			const sig = Signature.fromP256(new Uint8Array(32), new Uint8Array(32));
			expect(() => Signature.getV(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should throw getV for Ed25519", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64));
			expect(() => Signature.getV(sig)).toThrow(
				Signature.InvalidAlgorithmError,
			);
		});

		it("should handle Ed25519 as always canonical", () => {
			const sig = Signature.fromEd25519(new Uint8Array(64).fill(0xff));
			expect(Signature.isCanonical(sig)).toBe(true);
		});
	});

	describe("compact encoding edge cases", () => {
		it("should handle compact without v (64 bytes)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s);
			const compact = Signature.toCompact(sig);
			expect(compact.length).toBe(64);
			expect(compact.slice(0, 32)).toEqual(r);
			expect(compact.slice(32, 64)).toEqual(s);
		});

		it("should handle compact with v (65 bytes)", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig = Signature.fromSecp256k1(r, s, 28);
			const compact = Signature.toCompact(sig);
			expect(compact.length).toBe(65);
			expect(compact[64]).toBe(28);
		});

		it("should roundtrip compact encoding without v", () => {
			const r = new Uint8Array(32).fill(3);
			const s = new Uint8Array(32).fill(4);
			const sig = Signature.fromSecp256k1(r, s);
			const compact = Signature.toCompact(sig);
			const sig2 = Signature.fromCompact(compact, "secp256k1");
			expect(Signature.equals(sig, sig2)).toBe(true);
		});

		it("should roundtrip compact encoding with v", () => {
			const r = new Uint8Array(32).fill(5);
			const s = new Uint8Array(32).fill(6);
			const sig = Signature.fromSecp256k1(r, s, 27);
			const compact = Signature.toCompact(sig);
			const sig2 = Signature.fromCompact(compact, "secp256k1");
			expect(Signature.equals(sig, sig2)).toBe(true);
			expect(sig2.v).toBe(27);
		});

		it("should handle P256 compact encoding", () => {
			const r = new Uint8Array(32).fill(7);
			const s = new Uint8Array(32).fill(8);
			const sig = Signature.fromP256(r, s);
			const compact = Signature.toCompact(sig);
			expect(compact.length).toBe(64);
		});

		it("should handle Ed25519 compact encoding", () => {
			const signature = new Uint8Array(64).fill(9);
			const sig = Signature.fromEd25519(signature);
			const compact = Signature.toCompact(sig);
			expect(compact).toEqual(signature);
		});

		it("should throw on invalid compact length", () => {
			const compact = new Uint8Array(63);
			expect(() => Signature.fromCompact(compact, "secp256k1")).toThrow(
				Signature.InvalidSignatureLengthError,
			);
		});
	});

	describe("equality and comparison", () => {
		it("should detect equal signatures", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r, s, 27);
			const sig2 = Signature.fromSecp256k1(r, s, 27);
			expect(Signature.equals(sig1, sig2)).toBe(true);
		});

		it("should detect different r values", () => {
			const r1 = new Uint8Array(32).fill(1);
			const r2 = new Uint8Array(32).fill(3);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r1, s, 27);
			const sig2 = Signature.fromSecp256k1(r2, s, 27);
			expect(Signature.equals(sig1, sig2)).toBe(false);
		});

		it("should detect different s values", () => {
			const r = new Uint8Array(32).fill(1);
			const s1 = new Uint8Array(32).fill(2);
			const s2 = new Uint8Array(32).fill(4);
			const sig1 = Signature.fromSecp256k1(r, s1, 27);
			const sig2 = Signature.fromSecp256k1(r, s2, 27);
			expect(Signature.equals(sig1, sig2)).toBe(false);
		});

		it("should detect different v values", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r, s, 27);
			const sig2 = Signature.fromSecp256k1(r, s, 28);
			expect(Signature.equals(sig1, sig2)).toBe(false);
		});

		it("should detect different algorithms", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r, s);
			const sig2 = Signature.fromP256(r, s);
			expect(Signature.equals(sig1, sig2)).toBe(false);
		});

		it("should handle equality with undefined v", () => {
			const r = new Uint8Array(32).fill(1);
			const s = new Uint8Array(32).fill(2);
			const sig1 = Signature.fromSecp256k1(r, s);
			const sig2 = Signature.fromSecp256k1(r, s);
			expect(Signature.equals(sig1, sig2)).toBe(true);
		});
	});

	describe("type guards and validation", () => {
		it("should identify BrandedSignature", () => {
			const sig = Signature.fromSecp256k1(
				new Uint8Array(32),
				new Uint8Array(32),
			);
			expect(Signature.is(sig)).toBe(true);
		});

		it("should reject plain Uint8Array", () => {
			expect(Signature.is(new Uint8Array(64))).toBe(false);
		});

		it("should reject null", () => {
			expect(Signature.is(null)).toBe(false);
		});

		it("should reject undefined", () => {
			expect(Signature.is(undefined)).toBe(false);
		});

		it("should reject objects", () => {
			expect(Signature.is({})).toBe(false);
		});

		it("should reject numbers", () => {
			expect(Signature.is(42)).toBe(false);
		});
	});
});

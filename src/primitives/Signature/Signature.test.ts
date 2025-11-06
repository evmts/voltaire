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
});

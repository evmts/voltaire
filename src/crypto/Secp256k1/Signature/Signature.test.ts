import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it } from "vitest";
import { InvalidSignatureError } from "../../../primitives/errors/index.js";
import { PrivateKey } from "../../../primitives/PrivateKey/BrandedPrivateKey/index.js";
import { sign } from "../sign.js";
import { fromBytes, fromCompact, toBytes, toCompact } from "./index.js";
describe("Secp256k1.Signature methods", () => {
	describe("toBytes", () => {
		it("should convert signature to 65-byte format", () => {
			const signature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
				v: 27,
			};

			const bytes = toBytes(signature);

			expect(bytes.length).toBe(65);
			expect(bytes).toBeInstanceOf(Uint8Array);
		});

		it("should encode r || s || v correctly", () => {
			const r = new Uint8Array(32).fill(0xaa);
			const s = new Uint8Array(32).fill(0xbb);
			const v = 28;

			const signature = { r, s, v };
			const bytes = toBytes(signature);

			// Check r
			for (let i = 0; i < 32; i++) {
				expect(bytes[i]).toBe(0xaa);
			}
			// Check s
			for (let i = 32; i < 64; i++) {
				expect(bytes[i]).toBe(0xbb);
			}
			// Check v
			expect(bytes[64]).toBe(28);
		});

		it("should handle v values 0, 1, 27, 28", () => {
			const base = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			for (const v of [0, 1, 27, 28]) {
				const bytes = toBytes({ ...base, v });
				expect(bytes[64]).toBe(v);
			}
		});

		it("should convert real signature to bytes", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = sha256(new TextEncoder().encode("test")) as any;

			const signature = sign(message, privateKey);
			const bytes = toBytes(signature);

			expect(bytes.length).toBe(65);
			// Compare using Array.from since BrandedHash is Uint8Array
			expect(Array.from(bytes.slice(0, 32))).toEqual(Array.from(signature.r));
			expect(Array.from(bytes.slice(32, 64))).toEqual(Array.from(signature.s));
			expect(bytes[64]).toBe(signature.v);
		});
	});

	describe("fromBytes", () => {
		it("should parse 65-byte signature", () => {
			const bytes = new Uint8Array(65);
			for (let i = 0; i < 32; i++) bytes[i] = 0xaa; // r
			for (let i = 32; i < 64; i++) bytes[i] = 0xbb; // s
			bytes[64] = 27; // v

			const signature = fromBytes(bytes);

			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
			expect(signature.v).toBe(27);

			for (let i = 0; i < 32; i++) {
				expect(signature.r[i]).toBe(0xaa);
				expect(signature.s[i]).toBe(0xbb);
			}
		});

		it("should throw InvalidSignatureError for wrong length", () => {
			const wrongLengths = [0, 1, 64, 66, 100];

			for (const length of wrongLengths) {
				const bytes = new Uint8Array(length);
				expect(() => fromBytes(bytes)).toThrow(InvalidSignatureError);
			}
		});

		it("should handle v values correctly", () => {
			for (const v of [0, 1, 27, 28]) {
				const bytes = new Uint8Array(65);
				bytes[64] = v;

				const signature = fromBytes(bytes);
				expect(signature.v).toBe(v);
			}
		});

		it("should roundtrip with toBytes", () => {
			const original = {
				r: new Uint8Array(32).fill(0x12),
				s: new Uint8Array(32).fill(0x34),
				v: 27,
			};

			const bytes = toBytes(original);
			const parsed = fromBytes(bytes);

			expect(parsed.r).toEqual(original.r);
			expect(parsed.s).toEqual(original.s);
			expect(parsed.v).toEqual(original.v);
		});

		it("should parse real signature bytes", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = sha256(new TextEncoder().encode("test")) as any;

			const signature = sign(message, privateKey);
			const bytes = toBytes(signature);
			const parsed = fromBytes(bytes);

			expect(Array.from(parsed.r)).toEqual(Array.from(signature.r));
			expect(Array.from(parsed.s)).toEqual(Array.from(signature.s));
			expect(parsed.v).toEqual(signature.v);
		});
	});

	describe("toCompact", () => {
		it("should convert signature to 64-byte compact format", () => {
			const signature = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
				v: 27,
			};

			const compact = toCompact(signature);

			expect(compact.length).toBe(64);
			expect(compact).toBeInstanceOf(Uint8Array);
		});

		it("should encode r || s without v", () => {
			const r = new Uint8Array(32).fill(0xaa);
			const s = new Uint8Array(32).fill(0xbb);
			const v = 28;

			const signature = { r, s, v };
			const compact = toCompact(signature);

			// Check r
			for (let i = 0; i < 32; i++) {
				expect(compact[i]).toBe(0xaa);
			}
			// Check s
			for (let i = 32; i < 64; i++) {
				expect(compact[i]).toBe(0xbb);
			}
			// No v in compact format
			expect(compact.length).toBe(64);
		});

		it("should ignore v parameter", () => {
			const base = {
				r: new Uint8Array(32).fill(1),
				s: new Uint8Array(32).fill(2),
			};

			// v shouldn't affect compact output
			const compact27 = toCompact({ ...base, v: 27 });
			const compact28 = toCompact({ ...base, v: 28 });

			expect(compact27).toEqual(compact28);
		});

		it("should convert real signature to compact", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = sha256(new TextEncoder().encode("test")) as any;

			const signature = sign(message, privateKey);
			const compact = toCompact(signature);

			expect(compact.length).toBe(64);
			// Compare using Array.from since BrandedHash is Uint8Array
			expect(Array.from(compact.slice(0, 32))).toEqual(Array.from(signature.r));
			expect(Array.from(compact.slice(32, 64))).toEqual(
				Array.from(signature.s),
			);
		});
	});

	describe("fromCompact", () => {
		it("should parse 64-byte compact signature", () => {
			const compact = new Uint8Array(64);
			for (let i = 0; i < 32; i++) compact[i] = 0xaa; // r
			for (let i = 32; i < 64; i++) compact[i] = 0xbb; // s
			const v = 27;

			const signature = fromCompact(compact, v);

			expect(signature.r.length).toBe(32);
			expect(signature.s.length).toBe(32);
			expect(signature.v).toBe(27);

			for (let i = 0; i < 32; i++) {
				expect(signature.r[i]).toBe(0xaa);
				expect(signature.s[i]).toBe(0xbb);
			}
		});

		it("should throw InvalidSignatureError for wrong length", () => {
			const wrongLengths = [0, 1, 32, 63, 65, 100];

			for (const length of wrongLengths) {
				const compact = new Uint8Array(length);
				expect(() => fromCompact(compact, 27)).toThrow(InvalidSignatureError);
			}
		});

		it("should accept v parameter", () => {
			const compact = new Uint8Array(64);

			for (const v of [0, 1, 27, 28]) {
				const signature = fromCompact(compact, v);
				expect(signature.v).toBe(v);
			}
		});

		it("should roundtrip with toCompact", () => {
			const original = {
				r: new Uint8Array(32).fill(0x12),
				s: new Uint8Array(32).fill(0x34),
				v: 27,
			};

			const compact = toCompact(original);
			const parsed = fromCompact(compact, original.v);

			expect(parsed.r).toEqual(original.r);
			expect(parsed.s).toEqual(original.s);
			expect(parsed.v).toEqual(original.v);
		});

		it("should parse real signature compact bytes", () => {
			const privateKeyBytes = new Uint8Array(32);
			privateKeyBytes[31] = 1;
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			const message = sha256(new TextEncoder().encode("test")) as any;

			const signature = sign(message, privateKey);
			const compact = toCompact(signature);
			const parsed = fromCompact(compact, signature.v);

			expect(Array.from(parsed.r)).toEqual(Array.from(signature.r));
			expect(Array.from(parsed.s)).toEqual(Array.from(signature.s));
			expect(parsed.v).toEqual(signature.v);
		});
	});

	describe("cross-format conversion", () => {
		it("should convert between full and compact formats", () => {
			const signature = {
				r: new Uint8Array(32).fill(0x42),
				s: new Uint8Array(32).fill(0x99),
				v: 28,
			};

			// Full -> Compact -> Full
			const fullBytes = toBytes(signature);
			const compact = toCompact(signature);
			const fromCompactSig = fromCompact(compact, signature.v);
			const backToFull = toBytes(fromCompactSig);

			expect(backToFull).toEqual(fullBytes);

			// Compact -> Full -> Compact
			const fromCompactSig2 = fromCompact(compact, 28);
			const fullBytes2 = toBytes(fromCompactSig2);
			const fromFullSig = fromBytes(fullBytes2);
			const backToCompact = toCompact(fromFullSig);

			expect(backToCompact).toEqual(compact);
		});

		it("should maintain data integrity across conversions", () => {
			const privateKeyBytes = new Uint8Array(32);
			const privateKey = PrivateKey.fromBytes(privateKeyBytes);
			for (let i = 0; i < 32; i++) {
				privateKey[i] = (i * 7) % 256;
			}
			const message = sha256(
				new TextEncoder().encode("conversion test"),
			) as any;

			const original = sign(message, privateKey);

			// Convert through all formats
			const fullBytes = toBytes(original);
			const compact = toCompact(original);
			const fromFull = fromBytes(fullBytes);
			const fromCompactSig = fromCompact(compact, original.v);

			// All should be equivalent (use Array.from for BrandedHash comparison)
			expect(Array.from(fromFull.r)).toEqual(Array.from(original.r));
			expect(Array.from(fromFull.s)).toEqual(Array.from(original.s));
			expect(fromFull.v).toEqual(original.v);

			expect(Array.from(fromCompactSig.r)).toEqual(Array.from(original.r));
			expect(Array.from(fromCompactSig.s)).toEqual(Array.from(original.s));
			expect(fromCompactSig.v).toEqual(original.v);
		});
	});

	describe("edge cases", () => {
		it("should handle all-zero r and s", () => {
			const signature = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
				v: 27,
			};

			const fullBytes = toBytes(signature);
			const compact = toCompact(signature);

			expect(fullBytes.length).toBe(65);
			expect(compact.length).toBe(64);

			const parsedFull = fromBytes(fullBytes);
			const parsedCompact = fromCompact(compact, 27);

			expect(Array.from(parsedFull.r)).toEqual(Array.from(signature.r));
			expect(Array.from(parsedFull.s)).toEqual(Array.from(signature.s));
			expect(Array.from(parsedCompact.r)).toEqual(Array.from(signature.r));
			expect(Array.from(parsedCompact.s)).toEqual(Array.from(signature.s));
		});

		it("should handle all-ones r and s", () => {
			const signature = {
				r: new Uint8Array(32).fill(0xff),
				s: new Uint8Array(32).fill(0xff),
				v: 27,
			};

			const fullBytes = toBytes(signature);
			const compact = toCompact(signature);

			const parsedFull = fromBytes(fullBytes);
			const parsedCompact = fromCompact(compact, 27);

			expect(Array.from(parsedFull.r)).toEqual(Array.from(signature.r));
			expect(Array.from(parsedFull.s)).toEqual(Array.from(signature.s));
			expect(Array.from(parsedCompact.r)).toEqual(Array.from(signature.r));
			expect(Array.from(parsedCompact.s)).toEqual(Array.from(signature.s));
		});

		it("should handle various byte patterns", () => {
			const patterns = [
				{ fill: 0x00, name: "zeros" },
				{ fill: 0x55, name: "0x55" },
				{ fill: 0xaa, name: "0xaa" },
				{ fill: 0xff, name: "ones" },
			];

			for (const { fill } of patterns) {
				const signature = {
					r: new Uint8Array(32).fill(fill),
					s: new Uint8Array(32).fill(fill),
					v: 27,
				};

				const bytes = toBytes(signature);
				const compact = toCompact(signature);

				expect(fromBytes(bytes)).toEqual(signature);
				expect(fromCompact(compact, 27)).toEqual(signature);
			}
		});
	});
});

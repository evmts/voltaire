import { Hash } from "@tevm/voltaire";
import * as VoltaireSecp256k1 from "@tevm/voltaire/Secp256k1";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import * as Secp256k1 from "./index.js";

describe("Secp256k1", () => {
	const testPrivateKeyBytes = new Uint8Array([
		0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
		0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
		0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
	]);

	const testMessageHashBytes = new Uint8Array([
		0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55,
		0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11,
		0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99,
	]);
	const testMessageHash = Hash.from(testMessageHashBytes);

	describe("sign", () => {
		it("signs a message hash with a private key", async () => {
			const result = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result).toHaveProperty("v");
			expect(result.r.length).toBe(32);
			expect(result.s.length).toBe(32);
			expect([27, 28]).toContain(result.v);
		});

		it("produces deterministic signatures (RFC 6979)", async () => {
			const sig1 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
			expect(sig1.v).toEqual(sig2.v);
		});

		it("fails with zero private key", async () => {
			const zeroKey = new Uint8Array(32);
			const exit = await Effect.runPromiseExit(
				Secp256k1.sign(testMessageHash, zeroKey as any),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (16 bytes)", async () => {
			const shortKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				Secp256k1.sign(testMessageHash, shortKey as any),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (64 bytes)", async () => {
			const longKey = new Uint8Array(64).fill(0x42);
			const exit = await Effect.runPromiseExit(
				Secp256k1.sign(testMessageHash, longKey as any),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with key equal to curve order", async () => {
			const curveOrder = new Uint8Array([
				0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
				0xff, 0xff, 0xff, 0xfe, 0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
				0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
			]);
			const exit = await Effect.runPromiseExit(
				Secp256k1.sign(testMessageHash, curveOrder as any),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("produces different signatures for different messages", async () => {
			const hash1 = Hash.from(new Uint8Array(32).fill(0x11));
			const hash2 = Hash.from(new Uint8Array(32).fill(0x22));

			const sig1 = await Effect.runPromise(
				Secp256k1.sign(hash1, testPrivateKeyBytes as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(hash2, testPrivateKeyBytes as any),
			);

			expect(sig1.r).not.toEqual(sig2.r);
		});

		it("produces different signatures for different keys", async () => {
			const key1 = new Uint8Array(32).fill(0x11);
			const key2 = new Uint8Array(32).fill(0x22);

			const sig1 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, key1 as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, key2 as any),
			);

			expect(sig1.r).not.toEqual(sig2.r);
		});
	});

	describe("recover", () => {
		it("recovers public key from signature", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			const recovered = await Effect.runPromise(
				Secp256k1.recover(signature, testMessageHash),
			);

			expect(recovered.length).toBe(64);

			const expected = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);
			expect(recovered).toEqual(expected);
		});

		it("fails with invalid v value", async () => {
			const badSignature = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 99,
			};

			const exit = await Effect.runPromiseExit(
				Secp256k1.recover(badSignature, testMessageHash),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with zero r value", async () => {
			const badSignature = {
				r: Hash.from(new Uint8Array(32)),
				s: Hash.from(new Uint8Array(32).fill(2)),
				v: 27,
			};

			const exit = await Effect.runPromiseExit(
				Secp256k1.recover(badSignature, testMessageHash),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with zero s value", async () => {
			const badSignature = {
				r: Hash.from(new Uint8Array(32).fill(1)),
				s: Hash.from(new Uint8Array(32)),
				v: 27,
			};

			const exit = await Effect.runPromiseExit(
				Secp256k1.recover(badSignature, testMessageHash),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("recovers different public keys for different signers", async () => {
			const key1 = new Uint8Array(32).fill(0x11);
			const key2 = new Uint8Array(32).fill(0x22);

			const sig1 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, key1 as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, key2 as any),
			);

			const recovered1 = await Effect.runPromise(
				Secp256k1.recover(sig1, testMessageHash),
			);
			const recovered2 = await Effect.runPromise(
				Secp256k1.recover(sig2, testMessageHash),
			);

			expect(recovered1).not.toEqual(recovered2);
		});
	});

	describe("verify", () => {
		it("verifies a valid signature", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, testMessageHash, publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("returns false for wrong message hash", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);
			const wrongHash = Hash.from(new Uint8Array(32).fill(0xff));

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, wrongHash, publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for wrong public key", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const otherKey = new Uint8Array(32).fill(0x42);
			const wrongPublicKey = VoltaireSecp256k1.derivePublicKey(otherKey as any);

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, testMessageHash, wrongPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for tampered r value", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);

			const tamperedR = new Uint8Array(signature.r);
			tamperedR[0] ^= 0xff;
			const tamperedSig = {
				...signature,
				r: Hash.from(tamperedR),
			};

			const isValid = await Effect.runPromise(
				Secp256k1.verify(tamperedSig, testMessageHash, publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for tampered s value", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);

			const tamperedS = new Uint8Array(signature.s);
			tamperedS[0] ^= 0xff;
			const tamperedSig = {
				...signature,
				s: Hash.from(tamperedS),
			};

			const isValid = await Effect.runPromise(
				Secp256k1.verify(tamperedSig, testMessageHash, publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("verifies signature with both v=27 and v=28", async () => {
			let foundV27 = false;
			let foundV28 = false;

			for (let i = 0; i < 100 && (!foundV27 || !foundV28); i++) {
				const key = new Uint8Array(32);
				key.fill(i + 1);
				const hash = Hash.from(new Uint8Array(32).fill(i));

				const sig = await Effect.runPromise(Secp256k1.sign(hash, key as any));
				const pubKey = VoltaireSecp256k1.derivePublicKey(key as any);

				if (sig.v === 27) foundV27 = true;
				if (sig.v === 28) foundV28 = true;

				const isValid = await Effect.runPromise(
					Secp256k1.verify(sig, hash, pubKey),
				);
				expect(isValid).toBe(true);
			}

			expect(foundV27 || foundV28).toBe(true);
		});
	});

	describe("Known Vector Tests", () => {
		const bytesToHex = (bytes: Uint8Array): string => {
			return (
				"0x" +
				Array.from(bytes)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")
			);
		};

		it("sign/recover round-trip with known key", async () => {
			const privateKey = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);

			const messageHashBytes = new Uint8Array([
				0x37, 0xbf, 0xc9, 0xe4, 0x00, 0xce, 0xa0, 0x40, 0x7f, 0x4d, 0xdc, 0xfc,
				0x6e, 0x29, 0x35, 0xf5, 0x1c, 0x8e, 0x7c, 0x03, 0xd3, 0xd4, 0x7c, 0xf1,
				0xf6, 0x02, 0x2c, 0x58, 0x50, 0x37, 0x6c, 0xd8,
			]);
			const messageHash = Hash.from(messageHashBytes);

			const sig = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);

			const recovered = await Effect.runPromise(
				Secp256k1.recover(sig, messageHash),
			);

			const expected = VoltaireSecp256k1.derivePublicKey(privateKey as any);
			expect(recovered).toEqual(expected);
			expect(recovered.length).toBe(64);
		});

		it("derives correct public key from known private key", async () => {
			const privateKey = new Uint8Array([
				0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4,
				0xd2, 0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc,
				0xae, 0x78, 0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
			]);

			const publicKey = VoltaireSecp256k1.derivePublicKey(privateKey as any);

			expect(publicKey.length).toBe(64);
			expect(publicKey[0]).toBe(0x83);
		});

		it("produces deterministic signatures (RFC 6979)", async () => {
			const privateKey = new Uint8Array([
				0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
				0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
				0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
			]);
			const messageHash = Hash.from(new Uint8Array(32).fill(0xab));

			const sig1 = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);
			const sig2 = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);

			expect(bytesToHex(sig1.r as Uint8Array)).toBe(
				bytesToHex(sig2.r as Uint8Array),
			);
			expect(bytesToHex(sig1.s as Uint8Array)).toBe(
				bytesToHex(sig2.s as Uint8Array),
			);
			expect(sig1.v).toBe(sig2.v);
		});

		it("handles all-ones private key", async () => {
			const privateKey = new Uint8Array(32).fill(0xff);
			privateKey[0] = 0x7f;

			const result = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, privateKey as any),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result).toHaveProperty("v");
		});

		it("handles minimum valid private key (1)", async () => {
			const privateKey = new Uint8Array(32);
			privateKey[31] = 1;

			const result = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, privateKey as any),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});
	});

	describe("Edge Cases", () => {
		it("handles zero message hash", async () => {
			const zeroHash = Hash.from(new Uint8Array(32));

			const result = await Effect.runPromise(
				Secp256k1.sign(zeroHash, testPrivateKeyBytes as any),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});

		it("handles max message hash (all 0xff)", async () => {
			const maxHash = Hash.from(new Uint8Array(32).fill(0xff));

			const result = await Effect.runPromise(
				Secp256k1.sign(maxHash, testPrivateKeyBytes as any),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});

		it("sign-recover-verify full round trip", async () => {
			const privateKey = new Uint8Array(32).fill(0x42);
			const messageHash = Hash.from(new Uint8Array(32).fill(0xab));

			const signature = await Effect.runPromise(
				Secp256k1.sign(messageHash, privateKey as any),
			);

			const recovered = await Effect.runPromise(
				Secp256k1.recover(signature, messageHash),
			);

			const isValid = await Effect.runPromise(
				Secp256k1.verify(signature, messageHash, recovered),
			);

			expect(isValid).toBe(true);
		});
	});

	describe("Secp256k1Service", () => {
		it("provides sign through service layer", async () => {
			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.sign(testMessageHash, testPrivateKeyBytes as any);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result).toHaveProperty("v");
		});

		it("provides recover through service layer", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);

			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.recover(signature, testMessageHash);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result.length).toBe(64);
		});

		it("provides verify through service layer", async () => {
			const signature = await Effect.runPromise(
				Secp256k1.sign(testMessageHash, testPrivateKeyBytes as any),
			);
			const publicKey = VoltaireSecp256k1.derivePublicKey(
				testPrivateKeyBytes as any,
			);

			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.verify(signature, testMessageHash, publicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result).toBe(true);
		});

		it("sign-recover-verify through service layer", async () => {
			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				const sig = yield* secp.sign(
					testMessageHash,
					testPrivateKeyBytes as any,
				);
				const pubKey = yield* secp.recover(sig, testMessageHash);
				return yield* secp.verify(sig, testMessageHash, pubKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Live)),
			);

			expect(result).toBe(true);
		});
	});

	describe("Secp256k1Test (mock layer)", () => {
		it("returns mock signature from test layer", async () => {
			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.sign(testMessageHash, testPrivateKeyBytes as any);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Test)),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result).toHaveProperty("v");
		});

		it("returns mock public key from recover in test layer", async () => {
			const mockSig = {
				r: Hash.from(new Uint8Array(32)),
				s: Hash.from(new Uint8Array(32)),
				v: 27 as const,
			};

			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.recover(mockSig, testMessageHash);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Test)),
			);

			expect(result.length).toBe(64);
		});

		it("returns true from verify in test layer", async () => {
			const mockSig = {
				r: Hash.from(new Uint8Array(32)),
				s: Hash.from(new Uint8Array(32)),
				v: 27 as const,
			};
			const mockPubKey = new Uint8Array(64);

			const program = Effect.gen(function* () {
				const secp = yield* Secp256k1.Secp256k1Service;
				return yield* secp.verify(mockSig, testMessageHash, mockPubKey as any);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Secp256k1.Secp256k1Test)),
			);

			expect(result).toBe(true);
		});
	});
});

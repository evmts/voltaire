import { Hash } from "@tevm/voltaire";
import * as VoltaireP256 from "@tevm/voltaire/P256";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import * as P256Effect from "./index.js";

describe("P256", () => {
	const testPrivateKey = VoltaireP256.randomPrivateKey();
	const testPublicKey = VoltaireP256.derivePublicKey(testPrivateKey);
	const testMessageHashBytes = new Uint8Array(32).fill(0xab);
	const testMessageHash = Hash.from(testMessageHashBytes);

	describe("sign", () => {
		it("signs a message hash with a private key", async () => {
			const result = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
			expect(result.r.length).toBe(32);
			expect(result.s.length).toBe(32);
		});

		it("produces deterministic signatures (RFC 6979)", async () => {
			const sig1 = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);
			const sig2 = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
		});

		it("fails with wrong key length (16 bytes)", async () => {
			const wrongKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				P256Effect.sign(testMessageHash, wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (64 bytes)", async () => {
			const longKey = new Uint8Array(64).fill(0x42);
			const exit = await Effect.runPromiseExit(
				P256Effect.sign(testMessageHash, longKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty key", async () => {
			const emptyKey = new Uint8Array(0);
			const exit = await Effect.runPromiseExit(
				P256Effect.sign(testMessageHash, emptyKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with zero private key", async () => {
			const zeroKey = new Uint8Array(32);
			const exit = await Effect.runPromiseExit(
				P256Effect.sign(testMessageHash, zeroKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("produces different signatures for different messages", async () => {
			const hash1 = Hash.from(new Uint8Array(32).fill(0x11));
			const hash2 = Hash.from(new Uint8Array(32).fill(0x22));

			const sig1 = await Effect.runPromise(
				P256Effect.sign(hash1, testPrivateKey),
			);
			const sig2 = await Effect.runPromise(
				P256Effect.sign(hash2, testPrivateKey),
			);

			expect(sig1.r).not.toEqual(sig2.r);
		});

		it("produces different signatures for different keys", async () => {
			const key1 = VoltaireP256.randomPrivateKey();
			const key2 = VoltaireP256.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				P256Effect.sign(testMessageHash, key1),
			);
			const sig2 = await Effect.runPromise(
				P256Effect.sign(testMessageHash, key2),
			);

			expect(sig1.r).not.toEqual(sig2.r);
		});

		it("handles all-ones private key (clamped)", async () => {
			const onesKey = new Uint8Array(32).fill(0xff);
			onesKey[0] = 0x7f;

			const result = await Effect.runPromise(
				P256Effect.sign(testMessageHash, onesKey),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});

		it("handles minimum valid private key", async () => {
			const minKey = new Uint8Array(32);
			minKey[31] = 1;

			const result = await Effect.runPromise(
				P256Effect.sign(testMessageHash, minKey),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});

		it("handles zero message hash", async () => {
			const zeroHash = Hash.from(new Uint8Array(32));

			const result = await Effect.runPromise(
				P256Effect.sign(zeroHash, testPrivateKey),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});

		it("handles max message hash (all 0xff)", async () => {
			const maxHash = Hash.from(new Uint8Array(32).fill(0xff));

			const result = await Effect.runPromise(
				P256Effect.sign(maxHash, testPrivateKey),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});
	});

	describe("verify", () => {
		it("verifies a valid signature", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			const isValid = await Effect.runPromise(
				P256Effect.verify(signature, testMessageHash, testPublicKey),
			);

			expect(isValid).toBe(true);
		});

		it("returns false for wrong message hash", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);
			const wrongHash = Hash.from(new Uint8Array(32).fill(0xff));

			const isValid = await Effect.runPromise(
				P256Effect.verify(signature, wrongHash, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for wrong public key", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);
			const otherKey = VoltaireP256.randomPrivateKey();
			const wrongPublicKey = VoltaireP256.derivePublicKey(otherKey);

			const isValid = await Effect.runPromise(
				P256Effect.verify(signature, testMessageHash, wrongPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for tampered r value", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			const tamperedR = new Uint8Array(signature.r);
			tamperedR[0] ^= 0xff;
			const tamperedSig = {
				...signature,
				r: tamperedR,
			};

			const isValid = await Effect.runPromise(
				P256Effect.verify(tamperedSig as any, testMessageHash, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for tampered s value", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			const tamperedS = new Uint8Array(signature.s);
			tamperedS[0] ^= 0xff;
			const tamperedSig = {
				...signature,
				s: tamperedS,
			};

			const isValid = await Effect.runPromise(
				P256Effect.verify(tamperedSig as any, testMessageHash, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for zero r value", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			const zeroSig = {
				...signature,
				r: new Uint8Array(32),
			};

			const isValid = await Effect.runPromise(
				P256Effect.verify(zeroSig as any, testMessageHash, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for zero s value", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			const zeroSig = {
				...signature,
				s: new Uint8Array(32),
			};

			const isValid = await Effect.runPromise(
				P256Effect.verify(zeroSig as any, testMessageHash, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("verifies signatures from multiple different keys", async () => {
			for (let i = 0; i < 5; i++) {
				const privateKey = VoltaireP256.randomPrivateKey();
				const publicKey = VoltaireP256.derivePublicKey(privateKey);
				const hash = Hash.from(new Uint8Array(32).fill(i));

				const sig = await Effect.runPromise(P256Effect.sign(hash, privateKey));

				const isValid = await Effect.runPromise(
					P256Effect.verify(sig, hash, publicKey),
				);

				expect(isValid).toBe(true);
			}
		});
	});

	describe("Full Round Trip", () => {
		it("sign-verify round trip with random key", async () => {
			const privateKey = VoltaireP256.randomPrivateKey();
			const publicKey = VoltaireP256.derivePublicKey(privateKey);
			const messageHash = Hash.from(new Uint8Array(32).fill(0xcd));

			const signature = await Effect.runPromise(
				P256Effect.sign(messageHash, privateKey),
			);

			const isValid = await Effect.runPromise(
				P256Effect.verify(signature, messageHash, publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("sign-verify with zero hash", async () => {
			const privateKey = VoltaireP256.randomPrivateKey();
			const publicKey = VoltaireP256.derivePublicKey(privateKey);
			const zeroHash = Hash.from(new Uint8Array(32));

			const signature = await Effect.runPromise(
				P256Effect.sign(zeroHash, privateKey),
			);

			const isValid = await Effect.runPromise(
				P256Effect.verify(signature, zeroHash, publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("sign-verify with max hash", async () => {
			const privateKey = VoltaireP256.randomPrivateKey();
			const publicKey = VoltaireP256.derivePublicKey(privateKey);
			const maxHash = Hash.from(new Uint8Array(32).fill(0xff));

			const signature = await Effect.runPromise(
				P256Effect.sign(maxHash, privateKey),
			);

			const isValid = await Effect.runPromise(
				P256Effect.verify(signature, maxHash, publicKey),
			);

			expect(isValid).toBe(true);
		});
	});

	describe("P256Service", () => {
		it("provides sign through service layer", async () => {
			const program = Effect.gen(function* () {
				const p256 = yield* P256Effect.P256Service;
				return yield* p256.sign(testMessageHash, testPrivateKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(P256Effect.P256Live)),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");
		});

		it("provides verify through service layer", async () => {
			const signature = await Effect.runPromise(
				P256Effect.sign(testMessageHash, testPrivateKey),
			);

			const program = Effect.gen(function* () {
				const p256 = yield* P256Effect.P256Service;
				return yield* p256.verify(signature, testMessageHash, testPublicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(P256Effect.P256Live)),
			);

			expect(result).toBe(true);
		});

		it("sign-verify through service layer", async () => {
			const program = Effect.gen(function* () {
				const p256 = yield* P256Effect.P256Service;
				const sig = yield* p256.sign(testMessageHash, testPrivateKey);
				return yield* p256.verify(sig, testMessageHash, testPublicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(P256Effect.P256Live)),
			);

			expect(result).toBe(true);
		});

		it("handles error in service layer", async () => {
			const zeroKey = new Uint8Array(32);

			const program = Effect.gen(function* () {
				const p256 = yield* P256Effect.P256Service;
				return yield* p256.sign(testMessageHash, zeroKey);
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(P256Effect.P256Live)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("signature r and s are exactly 32 bytes", async () => {
			for (let i = 0; i < 10; i++) {
				const privateKey = VoltaireP256.randomPrivateKey();
				const hash = Hash.from(new Uint8Array(32).fill(i));

				const sig = await Effect.runPromise(P256Effect.sign(hash, privateKey));

				expect(sig.r.length).toBe(32);
				expect(sig.s.length).toBe(32);
			}
		});

		it("public key derivation is deterministic", async () => {
			const privateKey = VoltaireP256.randomPrivateKey();

			const pubKey1 = VoltaireP256.derivePublicKey(privateKey);
			const pubKey2 = VoltaireP256.derivePublicKey(privateKey);

			expect(pubKey1).toEqual(pubKey2);
		});

		it("different private keys produce different public keys", async () => {
			const key1 = VoltaireP256.randomPrivateKey();
			const key2 = VoltaireP256.randomPrivateKey();

			const pubKey1 = VoltaireP256.derivePublicKey(key1);
			const pubKey2 = VoltaireP256.derivePublicKey(key2);

			expect(pubKey1).not.toEqual(pubKey2);
		});

		it("accepts Uint8Array message hash (not just Hash type)", async () => {
			const rawHash = new Uint8Array(32).fill(0xef);

			const result = await Effect.runPromise(
				P256Effect.sign(rawHash, testPrivateKey),
			);

			expect(result).toHaveProperty("r");
			expect(result).toHaveProperty("s");

			const isValid = await Effect.runPromise(
				P256Effect.verify(result, rawHash, testPublicKey),
			);

			expect(isValid).toBe(true);
		});
	});

	describe("Known Vectors", () => {
		it("produces consistent signatures for same inputs", async () => {
			const privateKey = VoltaireP256.randomPrivateKey();
			const hash = Hash.from(new Uint8Array(32).fill(0x42));

			const sig1 = await Effect.runPromise(P256Effect.sign(hash, privateKey));
			const sig2 = await Effect.runPromise(P256Effect.sign(hash, privateKey));
			const sig3 = await Effect.runPromise(P256Effect.sign(hash, privateKey));

			expect(sig1.r).toEqual(sig2.r);
			expect(sig1.s).toEqual(sig2.s);
			expect(sig2.r).toEqual(sig3.r);
			expect(sig2.s).toEqual(sig3.s);
		});

		it("validates random key generation produces valid keys", async () => {
			for (let i = 0; i < 5; i++) {
				const privateKey = VoltaireP256.randomPrivateKey();

				expect(privateKey.length).toBe(32);
				expect(VoltaireP256.validatePrivateKey(privateKey)).toBe(true);
			}
		});
	});
});

import * as VoltaireEd25519 from "@tevm/voltaire/Ed25519";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import * as Ed25519Effect from "./index.js";

describe("Ed25519", () => {
	const testSeed = new Uint8Array(32).fill(0x42);
	const testKeypair = VoltaireEd25519.keypairFromSeed(testSeed);
	const testMessage = new TextEncoder().encode("Hello, world!");

	describe("sign", () => {
		it("signs a message with a secret key", async () => {
			const result = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("produces deterministic signatures", async () => {
			const sig1 = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);
			const sig2 = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);

			expect(sig1).toEqual(sig2);
		});

		it("fails with wrong key length (16 bytes)", async () => {
			const wrongKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.sign(testMessage, wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (64 bytes instead of 32)", async () => {
			const wrongKey = new Uint8Array(64).fill(0x42);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.sign(testMessage, wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty key", async () => {
			const emptyKey = new Uint8Array(0);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.sign(testMessage, emptyKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("signs empty message", async () => {
			const emptyMessage = new Uint8Array(0);
			const result = await Effect.runPromise(
				Ed25519Effect.sign(emptyMessage, testKeypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("signs large message", async () => {
			const largeMessage = new Uint8Array(10000).fill(0xab);
			const result = await Effect.runPromise(
				Ed25519Effect.sign(largeMessage, testKeypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("produces different signatures for different messages", async () => {
			const msg1 = new TextEncoder().encode("Message 1");
			const msg2 = new TextEncoder().encode("Message 2");

			const sig1 = await Effect.runPromise(
				Ed25519Effect.sign(msg1, testKeypair.secretKey),
			);
			const sig2 = await Effect.runPromise(
				Ed25519Effect.sign(msg2, testKeypair.secretKey),
			);

			expect(sig1).not.toEqual(sig2);
		});

		it("produces different signatures for different keys", async () => {
			const seed1 = new Uint8Array(32).fill(0x11);
			const seed2 = new Uint8Array(32).fill(0x22);
			const keypair1 = VoltaireEd25519.keypairFromSeed(seed1);
			const keypair2 = VoltaireEd25519.keypairFromSeed(seed2);

			const sig1 = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, keypair1.secretKey),
			);
			const sig2 = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, keypair2.secretKey),
			);

			expect(sig1).not.toEqual(sig2);
		});

		it("handles all-zeros secret key", async () => {
			const zeroSeed = new Uint8Array(32);
			const keypair = VoltaireEd25519.keypairFromSeed(zeroSeed);

			const result = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, keypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("handles all-ones secret key", async () => {
			const onesSeed = new Uint8Array(32).fill(0xff);
			const keypair = VoltaireEd25519.keypairFromSeed(onesSeed);

			const result = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, keypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});
	});

	describe("verify", () => {
		it("verifies a valid signature", async () => {
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(signature, testMessage, testKeypair.publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("returns false for wrong message", async () => {
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);
			const wrongMessage = new TextEncoder().encode("Wrong message");

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(signature, wrongMessage, testKeypair.publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for wrong public key", async () => {
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);
			const otherSeed = new Uint8Array(32).fill(0x99);
			const otherKeypair = VoltaireEd25519.keypairFromSeed(otherSeed);

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(signature, testMessage, otherKeypair.publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for tampered signature", async () => {
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);

			const tamperedSig = new Uint8Array(signature);
			tamperedSig[0] ^= 0xff;

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(tamperedSig, testMessage, testKeypair.publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for all-zeros signature", async () => {
			const zeroSig = new Uint8Array(64);

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(zeroSig, testMessage, testKeypair.publicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for signature with wrong length", async () => {
			const shortSig = new Uint8Array(32);

			const exit = await Effect.runPromiseExit(
				Ed25519Effect.verify(shortSig, testMessage, testKeypair.publicKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with public key of wrong length", async () => {
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);
			const wrongPubKey = new Uint8Array(16);

			const exit = await Effect.runPromiseExit(
				Ed25519Effect.verify(signature, testMessage, wrongPubKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("verifies empty message signature", async () => {
			const emptyMessage = new Uint8Array(0);
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(emptyMessage, testKeypair.secretKey),
			);

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(signature, emptyMessage, testKeypair.publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("verifies large message signature", async () => {
			const largeMessage = new Uint8Array(10000).fill(0xab);
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(largeMessage, testKeypair.secretKey),
			);

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(signature, largeMessage, testKeypair.publicKey),
			);

			expect(isValid).toBe(true);
		});
	});

	describe("getPublicKey", () => {
		it("derives public key from secret key", async () => {
			const result = await Effect.runPromise(
				Ed25519Effect.getPublicKey(testKeypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
			expect(result).toEqual(testKeypair.publicKey);
		});

		it("fails with wrong key length (16 bytes)", async () => {
			const wrongKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.getPublicKey(wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (64 bytes)", async () => {
			const wrongKey = new Uint8Array(64).fill(0x42);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.getPublicKey(wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty key", async () => {
			const emptyKey = new Uint8Array(0);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.getPublicKey(emptyKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("derives different public keys for different secret keys", async () => {
			const seed1 = new Uint8Array(32).fill(0x11);
			const seed2 = new Uint8Array(32).fill(0x22);
			const keypair1 = VoltaireEd25519.keypairFromSeed(seed1);
			const keypair2 = VoltaireEd25519.keypairFromSeed(seed2);

			const pubKey1 = await Effect.runPromise(
				Ed25519Effect.getPublicKey(keypair1.secretKey),
			);
			const pubKey2 = await Effect.runPromise(
				Ed25519Effect.getPublicKey(keypair2.secretKey),
			);

			expect(pubKey1).not.toEqual(pubKey2);
		});

		it("derives same public key for same secret key (deterministic)", async () => {
			const pubKey1 = await Effect.runPromise(
				Ed25519Effect.getPublicKey(testKeypair.secretKey),
			);
			const pubKey2 = await Effect.runPromise(
				Ed25519Effect.getPublicKey(testKeypair.secretKey),
			);

			expect(pubKey1).toEqual(pubKey2);
		});

		it("handles all-zeros secret key", async () => {
			const zeroSeed = new Uint8Array(32);
			const keypair = VoltaireEd25519.keypairFromSeed(zeroSeed);

			const result = await Effect.runPromise(
				Ed25519Effect.getPublicKey(keypair.secretKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});
	});

	describe("Full Round Trip", () => {
		it("sign-verify round trip", async () => {
			const seed = new Uint8Array(32).fill(0xab);
			const keypair = VoltaireEd25519.keypairFromSeed(seed);
			const message = new TextEncoder().encode("Round trip test");

			const signature = await Effect.runPromise(
				Ed25519Effect.sign(message, keypair.secretKey),
			);

			const isValid = await Effect.runPromise(
				Ed25519Effect.verify(signature, message, keypair.publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("getPublicKey matches keypair derivation", async () => {
			const seed = new Uint8Array(32).fill(0xcd);
			const keypair = VoltaireEd25519.keypairFromSeed(seed);

			const derivedPubKey = await Effect.runPromise(
				Ed25519Effect.getPublicKey(keypair.secretKey),
			);

			expect(derivedPubKey).toEqual(keypair.publicKey);
		});
	});

	describe("Ed25519Service", () => {
		it("provides sign through service layer", async () => {
			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				return yield* ed.sign(testMessage, testKeypair.secretKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
		});

		it("provides verify through service layer", async () => {
			const signature = await Effect.runPromise(
				Ed25519Effect.sign(testMessage, testKeypair.secretKey),
			);

			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				return yield* ed.verify(signature, testMessage, testKeypair.publicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Live)),
			);

			expect(result).toBe(true);
		});

		it("provides getPublicKey through service layer", async () => {
			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				return yield* ed.getPublicKey(testKeypair.secretKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("sign-verify through service layer", async () => {
			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				const sig = yield* ed.sign(testMessage, testKeypair.secretKey);
				const pubKey = yield* ed.getPublicKey(testKeypair.secretKey);
				return yield* ed.verify(sig, testMessage, pubKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Live)),
			);

			expect(result).toBe(true);
		});
	});

	describe("Ed25519Test (mock layer)", () => {
		it("returns mock signature", async () => {
			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				return yield* ed.sign(testMessage, testKeypair.secretKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Test)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(64);
			expect(result.every((b) => b === 0)).toBe(true);
		});

		it("returns true for verify", async () => {
			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				return yield* ed.verify(
					new Uint8Array(64),
					testMessage,
					testKeypair.publicKey,
				);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Test)),
			);

			expect(result).toBe(true);
		});

		it("returns mock public key", async () => {
			const program = Effect.gen(function* () {
				const ed = yield* Ed25519Effect.Ed25519Service;
				return yield* ed.getPublicKey(testKeypair.secretKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Ed25519Effect.Ed25519Test)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
			expect(result.every((b) => b === 0)).toBe(true);
		});
	});

	describe("Known Vectors", () => {
		it("produces consistent signature for known seed", async () => {
			const knownSeed = new Uint8Array([
				0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60, 0xba, 0x84, 0x4a, 0xf4,
				0x92, 0xec, 0x2c, 0xc4, 0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19,
				0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
			]);
			const keypair = VoltaireEd25519.keypairFromSeed(knownSeed);
			const emptyMessage = new Uint8Array(0);

			const sig1 = await Effect.runPromise(
				Ed25519Effect.sign(emptyMessage, keypair.secretKey),
			);
			const sig2 = await Effect.runPromise(
				Ed25519Effect.sign(emptyMessage, keypair.secretKey),
			);

			expect(sig1).toEqual(sig2);
			expect(sig1.length).toBe(64);
		});

		it("public key is 32 bytes for all valid seeds", async () => {
			for (let i = 0; i < 10; i++) {
				const seed = new Uint8Array(32).fill(i);
				const keypair = VoltaireEd25519.keypairFromSeed(seed);

				const pubKey = await Effect.runPromise(
					Ed25519Effect.getPublicKey(keypair.secretKey),
				);

				expect(pubKey.length).toBe(32);
			}
		});
	});
});

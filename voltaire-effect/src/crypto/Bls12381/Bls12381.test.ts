import * as VoltaireBls12381 from "@tevm/voltaire/Bls12381";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "vitest";
import * as Bls12381Effect from "./index.js";

describe("Bls12381", () => {
	const testPrivateKey = VoltaireBls12381.randomPrivateKey();
	const testPublicKey = VoltaireBls12381.derivePublicKey(testPrivateKey);
	const testMessage = new TextEncoder().encode("Hello, Ethereum!");

	describe("sign", () => {
		it("signs a message with a private key", async () => {
			const result = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		});

		it("produces deterministic signatures", async () => {
			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			expect(sig1).toEqual(sig2);
		});

		it("fails with zero private key", async () => {
			const zeroKey = new Uint8Array(32);
			const exit = await Effect.runPromiseExit(
				Bls12381Effect.sign(testMessage, zeroKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (16 bytes)", async () => {
			const shortKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				Bls12381Effect.sign(testMessage, shortKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with wrong key length (64 bytes)", async () => {
			const longKey = new Uint8Array(64).fill(0x42);
			const exit = await Effect.runPromiseExit(
				Bls12381Effect.sign(testMessage, longKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with empty key", async () => {
			const emptyKey = new Uint8Array(0);
			const exit = await Effect.runPromiseExit(
				Bls12381Effect.sign(testMessage, emptyKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("signs empty message", async () => {
			const emptyMessage = new Uint8Array(0);
			const result = await Effect.runPromise(
				Bls12381Effect.sign(emptyMessage, testPrivateKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		});

		it("signs large message", async () => {
			const largeMessage = new Uint8Array(10000).fill(0xab);
			const result = await Effect.runPromise(
				Bls12381Effect.sign(largeMessage, testPrivateKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		});

		it("produces different signatures for different messages", async () => {
			const msg1 = new TextEncoder().encode("Message 1");
			const msg2 = new TextEncoder().encode("Message 2");

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(msg1, testPrivateKey),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(msg2, testPrivateKey),
			);

			expect(sig1).not.toEqual(sig2);
		});

		it("produces different signatures for different keys", async () => {
			const key1 = VoltaireBls12381.randomPrivateKey();
			const key2 = VoltaireBls12381.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, key1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, key2),
			);

			expect(sig1).not.toEqual(sig2);
		});

		it("handles minimum valid private key", async () => {
			const minKey = new Uint8Array(32);
			minKey[31] = 1;

			const result = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, minKey),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		});
	});

	describe("verify", () => {
		it("verifies a valid signature", async () => {
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(signature, testMessage, testPublicKey),
			);

			expect(isValid).toBe(true);
		});

		it("returns false for wrong message", async () => {
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);
			const wrongMessage = new TextEncoder().encode("Wrong message");

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(signature, wrongMessage, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for wrong public key", async () => {
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);
			const otherPrivateKey = VoltaireBls12381.randomPrivateKey();
			const wrongPublicKey = VoltaireBls12381.derivePublicKey(otherPrivateKey);

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(signature, testMessage, wrongPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for tampered signature", async () => {
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			const tamperedSig = new Uint8Array(signature);
			tamperedSig[0] ^= 0xff;

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(tamperedSig, testMessage, testPublicKey),
			);

			expect(isValid).toBe(false);
		});

		it("returns false for zero signature", async () => {
			const zeroSig = new Uint8Array(48);

			const exit = await Effect.runPromiseExit(
				Bls12381Effect.verify(zeroSig, testMessage, testPublicKey),
			);

			if (Exit.isSuccess(exit)) {
				expect(exit.value).toBe(false);
			}
		});

		it("verifies empty message signature", async () => {
			const emptyMessage = new Uint8Array(0);
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(emptyMessage, testPrivateKey),
			);

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(signature, emptyMessage, testPublicKey),
			);

			expect(isValid).toBe(true);
		});

		it("verifies large message signature", async () => {
			const largeMessage = new Uint8Array(10000).fill(0xab);
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(largeMessage, testPrivateKey),
			);

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(signature, largeMessage, testPublicKey),
			);

			expect(isValid).toBe(true);
		});

		it("verifies signatures from multiple different keys", async () => {
			for (let i = 0; i < 3; i++) {
				const privateKey = VoltaireBls12381.randomPrivateKey();
				const publicKey = VoltaireBls12381.derivePublicKey(privateKey);
				const message = new TextEncoder().encode(`Message ${i}`);

				const sig = await Effect.runPromise(
					Bls12381Effect.sign(message, privateKey),
				);

				const isValid = await Effect.runPromise(
					Bls12381Effect.verify(sig, message, publicKey),
				);

				expect(isValid).toBe(true);
			}
		});
	});

	describe("aggregate", () => {
		it("aggregates multiple signatures", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const pk2 = VoltaireBls12381.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk2),
			);

			const aggSig = await Effect.runPromise(
				Bls12381Effect.aggregate([sig1, sig2]),
			);

			expect(aggSig).toBeInstanceOf(Uint8Array);
			expect(aggSig.length).toBe(48);
		});

		it("fails with empty array", async () => {
			const exit = await Effect.runPromiseExit(Bls12381Effect.aggregate([]));

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("aggregates single signature (identity)", async () => {
			const sig = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			const aggSig = await Effect.runPromise(Bls12381Effect.aggregate([sig]));

			expect(aggSig).toBeInstanceOf(Uint8Array);
			expect(aggSig.length).toBe(48);
		});

		it("aggregates three signatures", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const pk2 = VoltaireBls12381.randomPrivateKey();
			const pk3 = VoltaireBls12381.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk2),
			);
			const sig3 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk3),
			);

			const aggSig = await Effect.runPromise(
				Bls12381Effect.aggregate([sig1, sig2, sig3]),
			);

			expect(aggSig).toBeInstanceOf(Uint8Array);
			expect(aggSig.length).toBe(48);
		});

		it("aggregation is deterministic", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const pk2 = VoltaireBls12381.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk2),
			);

			const aggSig1 = await Effect.runPromise(
				Bls12381Effect.aggregate([sig1, sig2]),
			);
			const aggSig2 = await Effect.runPromise(
				Bls12381Effect.aggregate([sig1, sig2]),
			);

			expect(aggSig1).toEqual(aggSig2);
		});

		it("aggregates many signatures", async () => {
			const signatures: Uint8Array[] = [];
			for (let i = 0; i < 10; i++) {
				const pk = VoltaireBls12381.randomPrivateKey();
				const sig = await Effect.runPromise(
					Bls12381Effect.sign(testMessage, pk),
				);
				signatures.push(sig);
			}

			const aggSig = await Effect.runPromise(
				Bls12381Effect.aggregate(signatures),
			);

			expect(aggSig).toBeInstanceOf(Uint8Array);
			expect(aggSig.length).toBe(48);
		});

		it("aggregated signature differs from individual signatures", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const pk2 = VoltaireBls12381.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk2),
			);

			const aggSig = await Effect.runPromise(
				Bls12381Effect.aggregate([sig1, sig2]),
			);

			expect(aggSig).not.toEqual(sig1);
			expect(aggSig).not.toEqual(sig2);
		});
	});

	describe("Full Round Trip", () => {
		it("sign-verify round trip", async () => {
			const privateKey = VoltaireBls12381.randomPrivateKey();
			const publicKey = VoltaireBls12381.derivePublicKey(privateKey);
			const message = new TextEncoder().encode("Round trip test");

			const signature = await Effect.runPromise(
				Bls12381Effect.sign(message, privateKey),
			);

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(signature, message, publicKey),
			);

			expect(isValid).toBe(true);
		});

		it("sign-aggregate-verify pattern", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const pubKey1 = VoltaireBls12381.derivePublicKey(pk1);

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);

			const aggSig = await Effect.runPromise(Bls12381Effect.aggregate([sig1]));

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(aggSig, testMessage, pubKey1),
			);

			expect(isValid).toBe(true);
		});
	});

	describe("Bls12381Service", () => {
		it("provides sign through service layer", async () => {
			const program = Effect.gen(function* () {
				const bls = yield* Bls12381Effect.Bls12381Service;
				return yield* bls.sign(testMessage, testPrivateKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Bls12381Effect.Bls12381Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(48);
		});

		it("provides verify through service layer", async () => {
			const signature = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			const program = Effect.gen(function* () {
				const bls = yield* Bls12381Effect.Bls12381Service;
				return yield* bls.verify(signature, testMessage, testPublicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Bls12381Effect.Bls12381Live)),
			);

			expect(result).toBe(true);
		});

		it("provides aggregate through service layer", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, testPrivateKey),
			);

			const program = Effect.gen(function* () {
				const bls = yield* Bls12381Effect.Bls12381Service;
				return yield* bls.aggregate([sig1, sig2]);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Bls12381Effect.Bls12381Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
		});

		it("sign-verify through service layer", async () => {
			const program = Effect.gen(function* () {
				const bls = yield* Bls12381Effect.Bls12381Service;
				const sig = yield* bls.sign(testMessage, testPrivateKey);
				return yield* bls.verify(sig, testMessage, testPublicKey);
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(Bls12381Effect.Bls12381Live)),
			);

			expect(result).toBe(true);
		});

		it("handles error in service layer", async () => {
			const zeroKey = new Uint8Array(32);

			const program = Effect.gen(function* () {
				const bls = yield* Bls12381Effect.Bls12381Service;
				return yield* bls.sign(testMessage, zeroKey);
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(Bls12381Effect.Bls12381Live)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("handles aggregate error in service layer", async () => {
			const program = Effect.gen(function* () {
				const bls = yield* Bls12381Effect.Bls12381Service;
				return yield* bls.aggregate([]);
			});

			const exit = await Effect.runPromiseExit(
				program.pipe(Effect.provide(Bls12381Effect.Bls12381Live)),
			);

			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("signature is always 48 bytes", async () => {
			for (let i = 0; i < 5; i++) {
				const privateKey = VoltaireBls12381.randomPrivateKey();
				const message = new TextEncoder().encode(`Message ${i}`);

				const sig = await Effect.runPromise(
					Bls12381Effect.sign(message, privateKey),
				);

				expect(sig.length).toBe(48);
			}
		});

		it("public key derivation is deterministic", async () => {
			const privateKey = VoltaireBls12381.randomPrivateKey();

			const pubKey1 = VoltaireBls12381.derivePublicKey(privateKey);
			const pubKey2 = VoltaireBls12381.derivePublicKey(privateKey);

			expect(pubKey1).toEqual(pubKey2);
		});

		it("different private keys produce different public keys", async () => {
			const key1 = VoltaireBls12381.randomPrivateKey();
			const key2 = VoltaireBls12381.randomPrivateKey();

			const pubKey1 = VoltaireBls12381.derivePublicKey(key1);
			const pubKey2 = VoltaireBls12381.derivePublicKey(key2);

			expect(pubKey1).not.toEqual(pubKey2);
		});

		it("public key is 48 bytes (compressed G1 point)", async () => {
			const privateKey = VoltaireBls12381.randomPrivateKey();
			const publicKey = VoltaireBls12381.derivePublicKey(privateKey);

			expect(publicKey.length).toBe(48);
		});

		it("random private key is 32 bytes", async () => {
			const privateKey = VoltaireBls12381.randomPrivateKey();

			expect(privateKey.length).toBe(32);
		});
	});

	describe("Known Vectors", () => {
		it("produces consistent signatures for same inputs", async () => {
			const privateKey = VoltaireBls12381.randomPrivateKey();
			const message = new TextEncoder().encode("Consistent test");

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(message, privateKey),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(message, privateKey),
			);
			const sig3 = await Effect.runPromise(
				Bls12381Effect.sign(message, privateKey),
			);

			expect(sig1).toEqual(sig2);
			expect(sig2).toEqual(sig3);
		});

		it("aggregation order does not matter (commutative)", async () => {
			const pk1 = VoltaireBls12381.randomPrivateKey();
			const pk2 = VoltaireBls12381.randomPrivateKey();

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk1),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(testMessage, pk2),
			);

			const aggSig1 = await Effect.runPromise(
				Bls12381Effect.aggregate([sig1, sig2]),
			);
			const aggSig2 = await Effect.runPromise(
				Bls12381Effect.aggregate([sig2, sig1]),
			);

			expect(aggSig1).toEqual(aggSig2);
		});
	});

	describe("Security Edge Cases", () => {
		it("signature changes when message changes by 1 bit", async () => {
			const msg1 = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
			const msg2 = new Uint8Array([0x00, 0x01, 0x02, 0x02]);

			const sig1 = await Effect.runPromise(
				Bls12381Effect.sign(msg1, testPrivateKey),
			);
			const sig2 = await Effect.runPromise(
				Bls12381Effect.sign(msg2, testPrivateKey),
			);

			expect(sig1).not.toEqual(sig2);
		});

		it("cannot verify with wrong domain separation", async () => {
			const msg1 = new TextEncoder().encode("domain1:message");
			const msg2 = new TextEncoder().encode("domain2:message");

			const sig = await Effect.runPromise(
				Bls12381Effect.sign(msg1, testPrivateKey),
			);

			const isValid = await Effect.runPromise(
				Bls12381Effect.verify(sig, msg2, testPublicKey),
			);

			expect(isValid).toBe(false);
		});
	});
});

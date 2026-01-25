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

		it("fails with wrong key length", async () => {
			const wrongKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.sign(testMessage, wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
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

		it("fails with wrong key length", async () => {
			const wrongKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				Ed25519Effect.getPublicKey(wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
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
	});

	describe("Ed25519Test", () => {
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
});

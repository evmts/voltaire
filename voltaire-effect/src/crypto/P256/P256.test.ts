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

		it("fails with wrong key length", async () => {
			const wrongKey = new Uint8Array(16);
			const exit = await Effect.runPromiseExit(
				P256Effect.sign(testMessageHash, wrongKey),
			);

			expect(Exit.isFailure(exit)).toBe(true);
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
	});
});

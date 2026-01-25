import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import * as AesGcm from "./index.js";

describe("AesGcm", () => {
	describe("generateKey", () => {
		it("generates 256-bit key by default", async () => {
			const result = await Effect.runPromise(AesGcm.generateKey());
			expect(result.length).toBe(32);
		});

		it("generates 128-bit key", async () => {
			const result = await Effect.runPromise(AesGcm.generateKey(128));
			expect(result.length).toBe(16);
		});
	});

	describe("generateNonce", () => {
		it("generates 12-byte nonce", async () => {
			const result = await Effect.runPromise(AesGcm.generateNonce());
			expect(result.length).toBe(12);
		});
	});

	describe("encrypt/decrypt roundtrip", () => {
		it("encrypts and decrypts correctly", async () => {
			const key = await Effect.runPromise(AesGcm.generateKey());
			const nonce = await Effect.runPromise(AesGcm.generateNonce());
			const plaintext = new Uint8Array([1, 2, 3, 4, 5]);

			const ciphertext = await Effect.runPromise(
				AesGcm.encrypt(key, plaintext, nonce),
			);
			const decrypted = await Effect.runPromise(
				AesGcm.decrypt(key, ciphertext, nonce),
			);

			expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
		});

		it("encrypts with AAD", async () => {
			const key = await Effect.runPromise(AesGcm.generateKey());
			const nonce = await Effect.runPromise(AesGcm.generateNonce());
			const plaintext = new Uint8Array([1, 2, 3]);
			const aad = new Uint8Array([10, 20, 30]);

			const ciphertext = await Effect.runPromise(
				AesGcm.encrypt(key, plaintext, nonce, aad),
			);
			const decrypted = await Effect.runPromise(
				AesGcm.decrypt(key, ciphertext, nonce, aad),
			);

			expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
		});
	});

	describe("Service layer", () => {
		it("works with live layer", async () => {
			const program = Effect.gen(function* () {
				const service = yield* AesGcm.AesGcmService;
				const key = yield* service.generateKey();
				return key.length;
			});

			const result = await Effect.runPromise(
				Effect.provide(program, AesGcm.AesGcmLive),
			);
			expect(result).toBe(32);
		});
	});
});

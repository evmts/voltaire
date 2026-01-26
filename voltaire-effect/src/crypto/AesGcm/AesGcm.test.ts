import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import * as AesGcm from "./index.js";

describe("AesGcm", () => {
	describe("generateKey", () => {
		it.effect("generates 256-bit key by default", () =>
			Effect.gen(function* () {
				const result = yield* AesGcm.generateKey();
				expect(result.length).toBe(32);
			})
		);

		it.effect("generates 128-bit key", () =>
			Effect.gen(function* () {
				const result = yield* AesGcm.generateKey(128);
				expect(result.length).toBe(16);
			})
		);
	});

	describe("generateNonce", () => {
		it.effect("generates 12-byte nonce", () =>
			Effect.gen(function* () {
				const result = yield* AesGcm.generateNonce();
				expect(result.length).toBe(12);
			})
		);
	});

	describe("encrypt/decrypt roundtrip", () => {
		it.effect("encrypts and decrypts correctly", () =>
			Effect.gen(function* () {
				const key = yield* AesGcm.generateKey();
				const nonce = yield* AesGcm.generateNonce();
				const plaintext = new Uint8Array([1, 2, 3, 4, 5]);
				const ciphertext = yield* AesGcm.encrypt(key, plaintext, nonce);
				const decrypted = yield* AesGcm.decrypt(key, ciphertext, nonce);
				expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
			})
		);

		it.effect("encrypts with AAD", () =>
			Effect.gen(function* () {
				const key = yield* AesGcm.generateKey();
				const nonce = yield* AesGcm.generateNonce();
				const plaintext = new Uint8Array([1, 2, 3]);
				const aad = new Uint8Array([10, 20, 30]);
				const ciphertext = yield* AesGcm.encrypt(key, plaintext, nonce, aad);
				const decrypted = yield* AesGcm.decrypt(key, ciphertext, nonce, aad);
				expect(Array.from(decrypted)).toEqual(Array.from(plaintext));
			})
		);
	});

	describe("Service layer", () => {
		it.effect("works with live layer", () =>
			Effect.gen(function* () {
				const service = yield* AesGcm.AesGcmService;
				const key = yield* service.generateKey();
				expect(key.length).toBe(32);
			}).pipe(Effect.provide(AesGcm.AesGcmLive))
		);
	});
});

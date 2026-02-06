import { describe, expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as AesGcm from "./index.js";

describe("AesGcm", () => {
	describe("generateKey", () => {
		it.effect("generates 256-bit key by default", () =>
			Effect.gen(function* () {
				const result = yield* AesGcm.generateKey();
				expect(result.length).toBe(32);
			}),
		);

		it.effect("generates 128-bit key", () =>
			Effect.gen(function* () {
				const result = yield* AesGcm.generateKey(128);
				expect(result.length).toBe(16);
			}),
		);
	});

	describe("generateNonce", () => {
		it.effect("generates 12-byte nonce", () =>
			Effect.gen(function* () {
				const result = yield* AesGcm.generateNonce();
				expect(result.length).toBe(12);
			}),
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
			}),
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
			}),
		);
	});

	describe("Service layer", () => {
		it.effect("works with live layer", () =>
			Effect.gen(function* () {
				const service = yield* AesGcm.AesGcmService;
				const key = yield* service.generateKey();
				expect(key.length).toBe(32);
			}).pipe(Effect.provide(AesGcm.AesGcmLive)),
		);
	});

	describe("input validation", () => {
		it.effect("rejects invalid key size on encrypt", () =>
			Effect.gen(function* () {
				const nonce = yield* AesGcm.generateNonce();
				const plaintext = new Uint8Array([1, 2, 3]);
				const invalidKey = new Uint8Array(10);
				const exit = yield* Effect.exit(
					AesGcm.encrypt(invalidKey, plaintext, nonce),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					expect(error._tag).toBe("Fail");
					if (error._tag === "Fail") {
						expect(error.error).toBeInstanceOf(AesGcm.InvalidKeyError);
						expect((error.error as AesGcm.InvalidKeyError).keyLength).toBe(10);
					}
				}
			}),
		);

		it.effect("rejects invalid nonce size on encrypt", () =>
			Effect.gen(function* () {
				const key = yield* AesGcm.generateKey();
				const plaintext = new Uint8Array([1, 2, 3]);
				const invalidNonce = new Uint8Array(8);
				const exit = yield* Effect.exit(
					AesGcm.encrypt(key, plaintext, invalidNonce),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					expect(error._tag).toBe("Fail");
					if (error._tag === "Fail") {
						expect(error.error).toBeInstanceOf(AesGcm.InvalidNonceError);
						expect((error.error as AesGcm.InvalidNonceError).nonceLength).toBe(
							8,
						);
					}
				}
			}),
		);

		it.effect("rejects invalid key size on decrypt", () =>
			Effect.gen(function* () {
				const nonce = yield* AesGcm.generateNonce();
				const ciphertext = new Uint8Array(32);
				const invalidKey = new Uint8Array(15);
				const exit = yield* Effect.exit(
					AesGcm.decrypt(invalidKey, ciphertext, nonce),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					expect(error._tag).toBe("Fail");
					if (error._tag === "Fail") {
						expect(error.error).toBeInstanceOf(AesGcm.InvalidKeyError);
					}
				}
			}),
		);

		it.effect("rejects invalid nonce size on decrypt", () =>
			Effect.gen(function* () {
				const key = yield* AesGcm.generateKey();
				const ciphertext = new Uint8Array(32);
				const invalidNonce = new Uint8Array(16);
				const exit = yield* Effect.exit(
					AesGcm.decrypt(key, ciphertext, invalidNonce),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					expect(error._tag).toBe("Fail");
					if (error._tag === "Fail") {
						expect(error.error).toBeInstanceOf(AesGcm.InvalidNonceError);
					}
				}
			}),
		);

		it.effect("accepts valid key sizes (16, 32 bytes)", () =>
			Effect.gen(function* () {
				const nonce = yield* AesGcm.generateNonce();
				const plaintext = new Uint8Array([1, 2, 3]);

				// AES-128 (16 bytes)
				const key16 = new Uint8Array(16).fill(1);
				const result16 = yield* AesGcm.encrypt(key16, plaintext, nonce);
				expect(result16.length).toBeGreaterThan(plaintext.length);

				// AES-256 (32 bytes)
				const nonce2 = yield* AesGcm.generateNonce();
				const key32 = new Uint8Array(32).fill(1);
				const result32 = yield* AesGcm.encrypt(key32, plaintext, nonce2);
				expect(result32.length).toBeGreaterThan(plaintext.length);
			}),
		);

		it.effect("rejects AES-192 (24-byte key)", () =>
			Effect.gen(function* () {
				const nonce = yield* AesGcm.generateNonce();
				const plaintext = new Uint8Array([1, 2, 3]);
				const key24 = new Uint8Array(24).fill(1);
				const exit = yield* Effect.exit(
					AesGcm.encrypt(key24, plaintext, nonce),
				);
				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit)) {
					const error = exit.cause;
					expect(error._tag).toBe("Fail");
					if (error._tag === "Fail") {
						expect(error.error).toBeInstanceOf(AesGcm.InvalidKeyError);
					}
				}
			}),
		);
	});
});

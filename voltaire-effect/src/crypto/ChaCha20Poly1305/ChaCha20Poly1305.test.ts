import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import {
	ChaCha20Poly1305Live,
	ChaCha20Poly1305Service,
	ChaCha20Poly1305Test,
	decrypt,
	encrypt,
	generateKey,
	generateNonce,
} from "./index.js";

describe("ChaCha20Poly1305Service", () => {
	describe("ChaCha20Poly1305Live", () => {
		it.effect("generates a 32-byte key", () =>
			Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				const result = yield* service.generateKey();
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(32);
			}).pipe(Effect.provide(ChaCha20Poly1305Live))
		);

		it.effect("generates a 12-byte nonce", () =>
			Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				const result = yield* service.generateNonce();
				expect(result).toBeInstanceOf(Uint8Array);
				expect(result.length).toBe(12);
			}).pipe(Effect.provide(ChaCha20Poly1305Live))
		);

		it.effect("encrypts and decrypts data correctly", () =>
			Effect.gen(function* () {
				const plaintext = new TextEncoder().encode("Hello, ChaCha20!");
				const service = yield* ChaCha20Poly1305Service;
				const key = yield* service.generateKey();
				const nonce = yield* service.generateNonce();
				const ciphertext = yield* service.encrypt(plaintext, key, nonce);
				const decrypted = yield* service.decrypt(ciphertext, key, nonce);
				expect(ciphertext).toBeInstanceOf(Uint8Array);
				expect(ciphertext.length).toBeGreaterThan(plaintext.length);
				expect(decrypted).toEqual(plaintext);
			}).pipe(Effect.provide(ChaCha20Poly1305Live))
		);

		it.effect("encrypts with additional authenticated data", () =>
			Effect.gen(function* () {
				const plaintext = new TextEncoder().encode("Secret message");
				const aad = new TextEncoder().encode("header data");
				const service = yield* ChaCha20Poly1305Service;
				const key = yield* service.generateKey();
				const nonce = yield* service.generateNonce();
				const ciphertext = yield* service.encrypt(plaintext, key, nonce, aad);
				const decrypted = yield* service.decrypt(ciphertext, key, nonce, aad);
				expect(decrypted).toEqual(plaintext);
			}).pipe(Effect.provide(ChaCha20Poly1305Live))
		);
	});

	describe("ChaCha20Poly1305Test", () => {
		it.effect("returns deterministic test values", () =>
			Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				const key = yield* service.generateKey();
				const nonce = yield* service.generateNonce();
				expect(key.length).toBe(32);
				expect(nonce.length).toBe(12);
				expect(key.every((b) => b === 0)).toBe(true);
				expect(nonce.every((b) => b === 0)).toBe(true);
			}).pipe(Effect.provide(ChaCha20Poly1305Test))
		);
	});
});

describe("operations", () => {
	it.effect("generateKey works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* generateKey();
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		}).pipe(Effect.provide(ChaCha20Poly1305Live))
	);

	it.effect("generateNonce works with service dependency", () =>
		Effect.gen(function* () {
			const result = yield* generateNonce();
			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(12);
		}).pipe(Effect.provide(ChaCha20Poly1305Live))
	);

	it.effect("encrypt/decrypt roundtrip works", () =>
		Effect.gen(function* () {
			const plaintext = new TextEncoder().encode("Test message");
			const key = yield* generateKey();
			const nonce = yield* generateNonce();
			const ciphertext = yield* encrypt(plaintext, key, nonce);
			const decrypted = yield* decrypt(ciphertext, key, nonce);
			expect(decrypted).toEqual(plaintext);
		}).pipe(Effect.provide(ChaCha20Poly1305Live))
	);

	it.effect("works with test layer", () =>
		Effect.gen(function* () {
			const key = yield* generateKey();
			const nonce = yield* generateNonce();
			expect(key.every((b) => b === 0)).toBe(true);
			expect(nonce.every((b) => b === 0)).toBe(true);
		}).pipe(Effect.provide(ChaCha20Poly1305Test))
	);
});

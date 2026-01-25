import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
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
		it("generates a 32-byte key", async () => {
			const program = Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				return yield* service.generateKey();
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(ChaCha20Poly1305Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(32);
		});

		it("generates a 12-byte nonce", async () => {
			const program = Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				return yield* service.generateNonce();
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(ChaCha20Poly1305Live)),
			);

			expect(result).toBeInstanceOf(Uint8Array);
			expect(result.length).toBe(12);
		});

		it("encrypts and decrypts data correctly", async () => {
			const plaintext = new TextEncoder().encode("Hello, ChaCha20!");

			const program = Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				const key = yield* service.generateKey();
				const nonce = yield* service.generateNonce();
				const ciphertext = yield* service.encrypt(plaintext, key, nonce);
				const decrypted = yield* service.decrypt(ciphertext, key, nonce);
				return { ciphertext, decrypted };
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(ChaCha20Poly1305Live)),
			);

			expect(result.ciphertext).toBeInstanceOf(Uint8Array);
			expect(result.ciphertext.length).toBeGreaterThan(plaintext.length);
			expect(result.decrypted).toEqual(plaintext);
		});

		it("encrypts with additional authenticated data", async () => {
			const plaintext = new TextEncoder().encode("Secret message");
			const aad = new TextEncoder().encode("header data");

			const program = Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				const key = yield* service.generateKey();
				const nonce = yield* service.generateNonce();
				const ciphertext = yield* service.encrypt(plaintext, key, nonce, aad);
				const decrypted = yield* service.decrypt(ciphertext, key, nonce, aad);
				return decrypted;
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(ChaCha20Poly1305Live)),
			);

			expect(result).toEqual(plaintext);
		});
	});

	describe("ChaCha20Poly1305Test", () => {
		it("returns deterministic test values", async () => {
			const program = Effect.gen(function* () {
				const service = yield* ChaCha20Poly1305Service;
				const key = yield* service.generateKey();
				const nonce = yield* service.generateNonce();
				return { key, nonce };
			});

			const result = await Effect.runPromise(
				program.pipe(Effect.provide(ChaCha20Poly1305Test)),
			);

			expect(result.key.length).toBe(32);
			expect(result.nonce.length).toBe(12);
			expect(result.key.every((b) => b === 0)).toBe(true);
			expect(result.nonce.every((b) => b === 0)).toBe(true);
		});
	});
});

describe("operations", () => {
	it("generateKey works with service dependency", async () => {
		const result = await Effect.runPromise(
			generateKey().pipe(Effect.provide(ChaCha20Poly1305Live)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(32);
	});

	it("generateNonce works with service dependency", async () => {
		const result = await Effect.runPromise(
			generateNonce().pipe(Effect.provide(ChaCha20Poly1305Live)),
		);

		expect(result).toBeInstanceOf(Uint8Array);
		expect(result.length).toBe(12);
	});

	it("encrypt/decrypt roundtrip works", async () => {
		const plaintext = new TextEncoder().encode("Test message");

		const program = Effect.gen(function* () {
			const key = yield* generateKey();
			const nonce = yield* generateNonce();
			const ciphertext = yield* encrypt(plaintext, key, nonce);
			const decrypted = yield* decrypt(ciphertext, key, nonce);
			return decrypted;
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ChaCha20Poly1305Live)),
		);

		expect(result).toEqual(plaintext);
	});

	it("works with test layer", async () => {
		const program = Effect.gen(function* () {
			const key = yield* generateKey();
			const nonce = yield* generateNonce();
			return { key, nonce };
		});

		const result = await Effect.runPromise(
			program.pipe(Effect.provide(ChaCha20Poly1305Test)),
		);

		expect(result.key.every((b) => b === 0)).toBe(true);
		expect(result.nonce.every((b) => b === 0)).toBe(true);
	});
});

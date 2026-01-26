import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect, it } from "@effect/vitest";
import * as Keystore from "./index.js";

describe("Keystore", () => {
	const testPrivateKey = new Uint8Array([
		0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
		0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
		0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20,
	]) as any;

	const testPassword = "test-password-123";

	describe("encrypt", () => {
		it.effect("encrypts a private key to keystore v3 format", () =>
			Effect.gen(function* () {
				const result = yield* Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
					scryptR: 8,
					scryptP: 1,
				});
				expect(result.version).toBe(3);
				expect(result.id).toBeDefined();
				expect(result.crypto.cipher).toBe("aes-128-ctr");
				expect(result.crypto.kdf).toBe("scrypt");
				expect(result.crypto.ciphertext).toBeDefined();
				expect(result.crypto.mac).toBeDefined();
			})
		);

		it.effect("supports pbkdf2 kdf", () =>
			Effect.gen(function* () {
				const result = yield* Keystore.encrypt(testPrivateKey, testPassword, {
					kdf: "pbkdf2",
					pbkdf2C: 1000,
				});
				expect(result.crypto.kdf).toBe("pbkdf2");
				expect((result.crypto.kdfparams as any).c).toBe(1000);
			})
		);
	});

	describe("decrypt", () => {
		it.effect("decrypts keystore back to original private key", () =>
			Effect.gen(function* () {
				const encrypted = yield* Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
					scryptR: 8,
					scryptP: 1,
				});
				const decrypted = yield* Keystore.decrypt(encrypted, testPassword);
				expect(decrypted).toEqual(testPrivateKey);
			})
		);

		it("fails with wrong password", async () => {
			const encrypted = await Effect.runPromise(
				Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
					scryptR: 8,
					scryptP: 1,
				}),
			);
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(encrypted, "wrong-password"),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with unsupported version", async () => {
			const badKeystore = {
				version: 2 as any,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00",
					cipherparams: { iv: "00" },
					kdf: "scrypt" as const,
					kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: "00" },
					mac: "00",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with unsupported KDF (argon2)", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
					cipherparams: { iv: "00112233445566778899aabbccddeeff" },
					kdf: "argon2" as any,
					kdfparams: { dklen: 32, salt: "00112233445566778899aabbccddeeff" },
					mac: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
			if (Exit.isFailure(exit)) {
				const error = exit.cause;
				expect(error).toBeDefined();
			}
		});

		it("fails with unsupported KDF (junk)", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
					cipherparams: { iv: "00112233445566778899aabbccddeeff" },
					kdf: "totally-not-a-kdf" as any,
					kdfparams: { dklen: 32, salt: "00112233445566778899aabbccddeeff" },
					mac: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with corrupted MAC", async () => {
			const encrypted = await Effect.runPromise(
				Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
					scryptR: 8,
					scryptP: 1,
				}),
			);
			const corruptedKeystore = {
				...encrypted,
				crypto: {
					...encrypted.crypto,
					mac: encrypted.crypto.mac.replace(/^./, encrypted.crypto.mac[0] === "0" ? "1" : "0"),
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(corruptedKeystore, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with corrupted ciphertext", async () => {
			const encrypted = await Effect.runPromise(
				Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
					scryptR: 8,
					scryptP: 1,
				}),
			);
			const corruptedKeystore = {
				...encrypted,
				crypto: {
					...encrypted.crypto,
					ciphertext: encrypted.crypto.ciphertext.replace(
						/^./,
						encrypted.crypto.ciphertext[0] === "0" ? "1" : "0",
					),
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(corruptedKeystore, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with missing crypto section", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with missing cipherparams.iv", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
					cipherparams: {},
					kdf: "scrypt" as const,
					kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: "00112233445566778899aabbccddeeff" },
					mac: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with invalid hex in ciphertext", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "not-valid-hex-gggg",
					cipherparams: { iv: "00112233445566778899aabbccddeeff" },
					kdf: "scrypt" as const,
					kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: "00112233445566778899aabbccddeeff" },
					mac: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with invalid hex in iv", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
					cipherparams: { iv: "zzzz-not-hex" },
					kdf: "scrypt" as const,
					kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: "00112233445566778899aabbccddeeff" },
					mac: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with invalid hex in salt", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
					cipherparams: { iv: "00112233445566778899aabbccddeeff" },
					kdf: "scrypt" as const,
					kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: "not-hex!!!" },
					mac: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});

		it("fails with invalid hex in mac", async () => {
			const badKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr" as const,
					ciphertext: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
					cipherparams: { iv: "00112233445566778899aabbccddeeff" },
					kdf: "scrypt" as const,
					kdfparams: { dklen: 32, n: 1024, r: 8, p: 1, salt: "00112233445566778899aabbccddeeff" },
					mac: "invalid-mac-not-hex",
				},
			};
			const exit = await Effect.runPromiseExit(
				Keystore.decrypt(badKeystore as any, testPassword),
			);
			expect(Exit.isFailure(exit)).toBe(true);
		});
	});

	describe("KeystoreService", () => {
		it.effect("provides encrypt through service layer", () =>
			Effect.gen(function* () {
				const keystore = yield* Keystore.KeystoreService;
				const result = yield* keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
				});
				expect(result.version).toBe(3);
				expect(result.crypto.cipher).toBe("aes-128-ctr");
			}).pipe(Effect.provide(Keystore.KeystoreLive))
		);

		it.effect("provides decrypt through service layer", () =>
			Effect.gen(function* () {
				const encrypted = yield* Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
				});
				const keystore = yield* Keystore.KeystoreService;
				const result = yield* keystore.decrypt(encrypted, testPassword);
				expect(result).toEqual(testPrivateKey);
			}).pipe(Effect.provide(Keystore.KeystoreLive))
		);

		it.effect("test layer returns mock data", () =>
			Effect.gen(function* () {
				const keystore = yield* Keystore.KeystoreService;
				const result = yield* keystore.encrypt(testPrivateKey, testPassword);
				expect(result.version).toBe(3);
				expect(result.id).toBe("test-uuid");
			}).pipe(Effect.provide(Keystore.KeystoreTest))
		);
	});

	describe("roundtrip", () => {
		it.effect("encrypts and decrypts with scrypt", () =>
			Effect.gen(function* () {
				const encrypted = yield* Keystore.encrypt(testPrivateKey, testPassword, {
					scryptN: 1024,
					scryptR: 8,
					scryptP: 1,
				});
				const decrypted = yield* Keystore.decrypt(encrypted, testPassword);
				expect(decrypted).toEqual(testPrivateKey);
			})
		);

		it.effect("encrypts and decrypts with pbkdf2", () =>
			Effect.gen(function* () {
				const encrypted = yield* Keystore.encrypt(testPrivateKey, testPassword, {
					kdf: "pbkdf2",
					pbkdf2C: 1000,
				});
				const decrypted = yield* Keystore.decrypt(encrypted, testPassword);
				expect(decrypted).toEqual(testPrivateKey);
			})
		);
	});
});

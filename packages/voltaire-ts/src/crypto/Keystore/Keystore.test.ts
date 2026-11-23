import { keccak_256 } from "@noble/hashes/sha3.js";
import { describe, expect, it } from "vitest";
import * as PrivateKey from "../../primitives/PrivateKey/index.js";
import * as Keystore from "./index.js";
import { hexToBytes } from "./utils.js";

describe("Keystore hex decoding", () => {
	it.each(["f", "0xabc", "g0", "0x0g", " 1"])(
		"rejects malformed hex %j",
		(hex) => {
			expect(() => hexToBytes(hex)).toThrow(
				/even number of hexadecimal digits/,
			);
		},
	);

	it.each(["00aB", "0x00aB"])("decodes mixed-case hex %s", (hex) => {
		expect(hexToBytes(hex)).toEqual(new Uint8Array([0, 0xab]));
	});
});

/**
 * Default KDF cost (scrypt N = 262144, pbkdf2 c = 262144) takes 35-60 s per
 * derivation under v8 coverage on 2-core CI runners. Tests that exercise the
 * defaults or the N/c = 262144 spec vectors get this budget; every other test
 * passes scryptN / pbkdf2C = 1024.
 */
const DEFAULT_KDF_TIMEOUT = 120_000;

describe("Keystore", () => {
	describe("encrypt / decrypt", () => {
		it(
			"encrypts and decrypts with scrypt (default)",
			async () => {
				const privateKey = PrivateKey.from(
					"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				);
				const password = "test-password";

				const keystore = await Keystore.encrypt(privateKey, password);
				const decrypted = Keystore.decrypt(keystore, password);

				expect(decrypted).toEqual(privateKey);
				const params = keystore.crypto.kdfparams as Keystore.ScryptParams;
				expect(params.n).toBe(262144);
			},
			DEFAULT_KDF_TIMEOUT,
		);

		it(
			"encrypts and decrypts with pbkdf2",
			async () => {
				const privateKey = PrivateKey.from(
					"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				);
				const password = "test-password";

				const keystore = await Keystore.encrypt(privateKey, password, {
					kdf: "pbkdf2",
				});
				const decrypted = Keystore.decrypt(keystore, password);

				expect(decrypted).toEqual(privateKey);
				const params = keystore.crypto.kdfparams as Keystore.Pbkdf2Params;
				expect(params.c).toBe(262144);
			},
			DEFAULT_KDF_TIMEOUT,
		);

		it("round-trip with different passwords", async () => {
			const privateKey = PrivateKey.from(
				"0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
			);

			const keystore1 = await Keystore.encrypt(privateKey, "password1", {
				scryptN: 1024,
			});
			const keystore2 = await Keystore.encrypt(privateKey, "password2", {
				scryptN: 1024,
			});

			expect(keystore1.crypto.ciphertext).not.toBe(keystore2.crypto.ciphertext);

			const decrypted1 = Keystore.decrypt(keystore1, "password1");
			const decrypted2 = Keystore.decrypt(keystore2, "password2");

			expect(decrypted1).toEqual(privateKey);
			expect(decrypted2).toEqual(privateKey);
		}, 60000);

		it("throws on wrong password (scrypt)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "correct-password", {
				scryptN: 1024,
			});

			expect(() => Keystore.decrypt(keystore, "wrong-password")).toThrow(
				Keystore.InvalidMacError,
			);
		}, 30000);

		it("throws on wrong password (pbkdf2)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "correct-password", {
				pbkdf2C: 1024,
				kdf: "pbkdf2",
			});

			expect(() => Keystore.decrypt(keystore, "wrong-password")).toThrow(
				Keystore.InvalidMacError,
			);
		}, 30000);

		it("handles empty password", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "", {
				scryptN: 1024,
			});
			const decrypted = Keystore.decrypt(keystore, "");

			expect(decrypted).toEqual(privateKey);
		}, 30000);

		it("handles special characters in password", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const password = "pāšẅörd!@#$%^&*()[]{}|<>?/~`";

			const keystore = await Keystore.encrypt(privateKey, password, {
				scryptN: 1024,
			});
			const decrypted = Keystore.decrypt(keystore, password);

			expect(decrypted).toEqual(privateKey);
		});

		it("handles very long password", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const password = "a".repeat(1000);

			const keystore = await Keystore.encrypt(privateKey, password, {
				scryptN: 1024,
			});
			const decrypted = Keystore.decrypt(keystore, password);

			expect(decrypted).toEqual(privateKey);
		});

		it("uses custom UUID when provided", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const customUuid = "12345678-1234-1234-1234-123456789abc";

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
				uuid: customUuid,
			});

			expect(keystore.id).toBe(customUuid);
		});

		it("generates different UUIDs for each encryption", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore1 = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});
			const keystore2 = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore1.id).not.toBe(keystore2.id);
		});

		it("uses custom scrypt parameters", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 16384,
				scryptR: 4,
				scryptP: 2,
			});

			const params = keystore.crypto.kdfparams as Keystore.ScryptParams;
			expect(params.n).toBe(16384);
			expect(params.r).toBe(4);
			expect(params.p).toBe(2);

			const decrypted = Keystore.decrypt(keystore, "password");
			expect(decrypted).toEqual(privateKey);
		});

		it("uses custom pbkdf2 iterations", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				kdf: "pbkdf2",
				pbkdf2C: 100000,
			});

			const params = keystore.crypto.kdfparams as Keystore.Pbkdf2Params;
			expect(params.c).toBe(100000);
			expect(params.prf).toBe("hmac-sha256");

			const decrypted = Keystore.decrypt(keystore, "password");
			expect(decrypted).toEqual(privateKey);
		});
	});

	describe("keystore structure", () => {
		it("has correct version", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore.version).toBe(3);
		});

		it("has correct cipher", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore.crypto.cipher).toBe("aes-128-ctr");
		});

		it("has valid UUID format", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			);
		});

		it("has 16-byte IV (32 hex chars)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore.crypto.cipherparams.iv).toHaveLength(32);
			expect(keystore.crypto.cipherparams.iv).toMatch(/^[0-9a-f]{32}$/);
		});

		it("has 32-byte salt (64 hex chars)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			const params = keystore.crypto.kdfparams as Keystore.ScryptParams;
			expect(params.salt).toHaveLength(64);
			expect(params.salt).toMatch(/^[0-9a-f]{64}$/);
		});

		it("has 32-byte MAC (64 hex chars)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore.crypto.mac).toHaveLength(64);
			expect(keystore.crypto.mac).toMatch(/^[0-9a-f]{64}$/);
		});

		it("has 32-byte ciphertext (64 hex chars) for 32-byte private key", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			expect(keystore.crypto.ciphertext).toHaveLength(64);
			expect(keystore.crypto.ciphertext).toMatch(/^[0-9a-f]{64}$/);
		});
	});

	describe("error handling", () => {
		it("throws on invalid scrypt N (not power of 2) during encrypt", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			// N = 1000 is not a power of 2
			await expect(
				Keystore.encrypt(privateKey, "password", { scryptN: 1000 }),
			).rejects.toThrow(Keystore.InvalidScryptNError);

			// N = 3 is not a power of 2
			await expect(
				Keystore.encrypt(privateKey, "password", { scryptN: 3 }),
			).rejects.toThrow(Keystore.InvalidScryptNError);

			// N = 0 is not valid
			await expect(
				Keystore.encrypt(privateKey, "password", { scryptN: 0 }),
			).rejects.toThrow(Keystore.InvalidScryptNError);

			// N = -1 is not valid
			await expect(
				Keystore.encrypt(privateKey, "password", { scryptN: -1 }),
			).rejects.toThrow(Keystore.InvalidScryptNError);
		});

		it("throws on invalid scrypt N during decrypt", async () => {
			// Craft a keystore with invalid N
			const invalidKeystore: Keystore.KeystoreV3 = {
				version: 3,
				id: "test-id",
				crypto: {
					cipher: "aes-128-ctr",
					ciphertext:
						"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
					cipherparams: {
						iv: "0123456789abcdef0123456789abcdef",
					},
					kdf: "scrypt",
					kdfparams: {
						dklen: 32,
						n: 1000, // Invalid: not a power of 2
						r: 8,
						p: 1,
						salt: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
					},
					mac: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				},
			};

			expect(() => Keystore.decrypt(invalidKeystore, "password")).toThrow(
				Keystore.InvalidScryptNError,
			);
		});

		it("throws on invalid PBKDF2 iterations (zero) during encrypt", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			await expect(
				Keystore.encrypt(privateKey, "password", { kdf: "pbkdf2", pbkdf2C: 0 }),
			).rejects.toThrow(Keystore.InvalidPbkdf2IterationsError);
		});

		it("throws on invalid PBKDF2 iterations (negative) during encrypt", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			await expect(
				Keystore.encrypt(privateKey, "password", {
					kdf: "pbkdf2",
					pbkdf2C: -1,
				}),
			).rejects.toThrow(Keystore.InvalidPbkdf2IterationsError);
		});

		it("throws on invalid PBKDF2 iterations (non-integer) during encrypt", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			await expect(
				Keystore.encrypt(privateKey, "password", {
					kdf: "pbkdf2",
					pbkdf2C: 1.5,
				}),
			).rejects.toThrow(Keystore.InvalidPbkdf2IterationsError);
		});

		it("throws on invalid PBKDF2 iterations during decrypt", async () => {
			// Craft a keystore with invalid iteration count
			const invalidKeystore: Keystore.KeystoreV3 = {
				version: 3,
				id: "test-id",
				crypto: {
					cipher: "aes-128-ctr",
					ciphertext:
						"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
					cipherparams: {
						iv: "0123456789abcdef0123456789abcdef",
					},
					kdf: "pbkdf2",
					kdfparams: {
						c: 0, // Invalid: must be positive
						dklen: 32,
						prf: "hmac-sha256",
						salt: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
					},
					mac: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
				},
			};

			expect(() => Keystore.decrypt(invalidKeystore, "password")).toThrow(
				Keystore.InvalidPbkdf2IterationsError,
			);
		});

		it("accepts valid PBKDF2 iteration counts", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			// Test various valid iteration counts
			const validCValues = [1, 100, 1000, 10000, 100000];

			for (const c of validCValues) {
				const keystore = await Keystore.encrypt(privateKey, "password", {
					kdf: "pbkdf2",
					pbkdf2C: c,
				});
				const params = keystore.crypto.kdfparams as Keystore.Pbkdf2Params;
				expect(params.c).toBe(c);
			}
		});

		it("accepts valid power of 2 scrypt N values", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			// Test various valid powers of 2
			// Note: @noble/hashes/scrypt requires N >= 2
			const validNValues = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

			for (const n of validNValues) {
				const keystore = await Keystore.encrypt(privateKey, "password", {
					scryptN: n,
					scryptR: 1,
					scryptP: 1,
				});
				const params = keystore.crypto.kdfparams as Keystore.ScryptParams;
				expect(params.n).toBe(n);
			}
		});

		it("throws on unsupported version", async () => {
			const invalidKeystore = {
				version: 2,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr",
					ciphertext: "abc",
					cipherparams: { iv: "def" },
					kdf: "scrypt" as const,
					kdfparams: {
						dklen: 32,
						n: 262144,
						r: 8,
						p: 1,
						salt: "ghi",
					},
					mac: "jkl",
				},
			};

			try {
				Keystore.decrypt(
					invalidKeystore as unknown as Keystore.KeystoreV3,
					"password",
				);
				expect.fail("Expected UnsupportedVersionError");
			} catch (e) {
				expect(e).toBeInstanceOf(Keystore.UnsupportedVersionError);
				expect((e as Error).name).toBe("UnsupportedVersionError");
			}
		});

		it("throws on unsupported KDF", async () => {
			const invalidKeystore = {
				version: 3,
				id: "test",
				crypto: {
					cipher: "aes-128-ctr",
					ciphertext: "abc",
					cipherparams: { iv: "def" },
					// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
					kdf: "unknown" as any,
					// biome-ignore lint/suspicious/noExplicitAny: testing invalid input
					kdfparams: {} as any,
					mac: "jkl",
				},
			};

			try {
				Keystore.decrypt(invalidKeystore, "password");
				expect.fail("Expected UnsupportedKdfError");
			} catch (e) {
				expect(e).toBeInstanceOf(Keystore.UnsupportedKdfError);
				expect((e as Error).name).toBe("UnsupportedKdfError");
			}
		});

		it("throws on corrupted ciphertext", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			// Corrupt ciphertext
			keystore.crypto.ciphertext = `${keystore.crypto.ciphertext.slice(0, -2)}ff`;

			try {
				Keystore.decrypt(keystore, "password");
				expect.fail("Expected InvalidMacError");
			} catch (e) {
				expect(e).toBeInstanceOf(Keystore.InvalidMacError);
				expect((e as Error).name).toBe("InvalidMacError");
			}
		});

		it("throws on corrupted MAC", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			// Corrupt MAC
			keystore.crypto.mac = `${keystore.crypto.mac.slice(0, -2)}ff`;

			try {
				Keystore.decrypt(keystore, "password");
				expect.fail("Expected InvalidMacError");
			} catch (e) {
				expect(e).toBeInstanceOf(Keystore.InvalidMacError);
				expect((e as Error).name).toBe("InvalidMacError");
			}
		});

		it("corrupted IV produces different plaintext", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
			});

			// Corrupt IV - MAC will still pass since it doesn't include IV,
			// but decryption will produce garbage
			keystore.crypto.cipherparams.iv = `${keystore.crypto.cipherparams.iv.slice(0, -2)}ff`;

			const decrypted = Keystore.decrypt(keystore, "password");
			expect(decrypted).not.toEqual(privateKey);
		});
	});

	describe("known test vectors", () => {
		// Web3 Secret Storage Definition test vectors (password "testpassword"):
		// https://ethereum.org/developers/docs/data-structures-and-encoding/web3-secret-storage
		const specPrivateKey =
			"0x7a28b5ba57c53603b0b07b56bba752f7784bf506fa95edc395f5cf6c7514fe9d";
		const toHex = (bytes: Uint8Array) =>
			`0x${Array.from(bytes)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;

		it(
			"decrypts the spec scrypt keystore (N=262144, r=1, p=8)",
			async () => {
				const keystore: Keystore.KeystoreV3 = {
					version: 3,
					id: "3198bc9c-6672-5ab3-d995-4942343ae5b6",
					crypto: {
						cipher: "aes-128-ctr",
						ciphertext:
							"d172bf743a674da9cdad04534d56926ef8358534d458fffccd4e6ad2fbde479c",
						cipherparams: {
							iv: "83dbcc02d8ccb40e466191a123791e0e",
						},
						kdf: "scrypt",
						kdfparams: {
							dklen: 32,
							n: 262144,
							r: 1,
							p: 8,
							salt: "ab0c7876052600dd703518d6fc3fe8984592145b591fc8fb5c6d43190334ba19",
						},
						mac: "2103ac29920d71da29f15d75b4a16dbe95cfd7ff8faea1056c33131d846e3097",
					},
				};

				const decrypted = Keystore.decrypt(keystore, "testpassword");
				expect(toHex(decrypted)).toBe(specPrivateKey);
			},
			DEFAULT_KDF_TIMEOUT,
		);

		it(
			"decrypts the spec pbkdf2 keystore (c=262144)",
			async () => {
				const keystore: Keystore.KeystoreV3 = {
					version: 3,
					id: "3198bc9c-6672-5ab3-d995-4942343ae5b6",
					crypto: {
						cipher: "aes-128-ctr",
						ciphertext:
							"5318b4d5bcd28de64ee5559e671353e16f075ecae9f99c7a79a38af5f869aa46",
						cipherparams: {
							iv: "6087dab2f9fdbbfaddc31a909735c1e6",
						},
						kdf: "pbkdf2",
						kdfparams: {
							c: 262144,
							dklen: 32,
							prf: "hmac-sha256",
							salt: "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd",
						},
						mac: "517ead924a9d0dc3124507e3393d175ce3ff7c1e96529c6c555ce9e51205e9b2",
					},
				};

				const decrypted = Keystore.decrypt(keystore, "testpassword");
				expect(toHex(decrypted)).toBe(specPrivateKey);
			},
			DEFAULT_KDF_TIMEOUT,
		);
	});

	describe("determinism", () => {
		it("produces same keystore with fixed salt and IV (scrypt)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const password = "password";

			const salt = new Uint8Array(32).fill(1);
			const iv = new Uint8Array(16).fill(2);
			const uuid = "12345678-1234-1234-1234-123456789abc";

			const keystore1 = await Keystore.encrypt(privateKey, password, {
				scryptN: 1024,
				salt,
				iv,
				uuid,
			});
			const keystore2 = await Keystore.encrypt(privateKey, password, {
				scryptN: 1024,
				salt,
				iv,
				uuid,
			});

			expect(keystore1).toEqual(keystore2);
		});

		it("produces same keystore with fixed salt and IV (pbkdf2)", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const password = "password";

			const salt = new Uint8Array(32).fill(1);
			const iv = new Uint8Array(16).fill(2);
			const uuid = "12345678-1234-1234-1234-123456789abc";

			const keystore1 = await Keystore.encrypt(privateKey, password, {
				pbkdf2C: 1024,
				kdf: "pbkdf2",
				salt,
				iv,
				uuid,
			});
			const keystore2 = await Keystore.encrypt(privateKey, password, {
				pbkdf2C: 1024,
				kdf: "pbkdf2",
				salt,
				iv,
				uuid,
			});

			expect(keystore1).toEqual(keystore2);
		});

		it("produces different keystores with different salts", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const password = "password";

			const salt1 = new Uint8Array(32).fill(1);
			const salt2 = new Uint8Array(32).fill(2);

			const keystore1 = await Keystore.encrypt(privateKey, password, {
				scryptN: 1024,
				salt: salt1,
			});
			const keystore2 = await Keystore.encrypt(privateKey, password, {
				scryptN: 1024,
				salt: salt2,
			});

			expect(keystore1.crypto.ciphertext).not.toBe(keystore2.crypto.ciphertext);
		});
	});

	describe("security", () => {
		it("different IVs produce different ciphertexts", {
			timeout: 30000,
		}, async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);
			const password = "password";
			const salt = new Uint8Array(32).fill(1);

			const iv1 = new Uint8Array(16).fill(1);
			const iv2 = new Uint8Array(16).fill(2);

			// Use low scrypt parameters for faster tests
			const keystore1 = await Keystore.encrypt(privateKey, password, {
				salt,
				iv: iv1,
				scryptN: 1024,
				scryptR: 1,
				scryptP: 1,
			});
			const keystore2 = await Keystore.encrypt(privateKey, password, {
				salt,
				iv: iv2,
				scryptN: 1024,
				scryptR: 1,
				scryptP: 1,
			});

			expect(keystore1.crypto.ciphertext).not.toBe(keystore2.crypto.ciphertext);

			const decrypted1 = Keystore.decrypt(keystore1, password);
			const decrypted2 = Keystore.decrypt(keystore2, password);

			expect(decrypted1).toEqual(privateKey);
			expect(decrypted2).toEqual(privateKey);
		});

		it("constant-time MAC comparison (no early exit)", {
			timeout: 30000,
		}, async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			// Use low scrypt parameters for faster tests
			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
				scryptR: 1,
				scryptP: 1,
			});

			// Modify first byte of MAC
			const corruptedKeystore1 = { ...keystore };
			corruptedKeystore1.crypto = { ...keystore.crypto };
			corruptedKeystore1.crypto.mac = `ff${keystore.crypto.mac.slice(2)}`;

			// Modify last byte of MAC
			const corruptedKeystore2 = { ...keystore };
			corruptedKeystore2.crypto = { ...keystore.crypto };
			corruptedKeystore2.crypto.mac = `${keystore.crypto.mac.slice(0, -2)}ff`;

			// Both should fail
			expect(() => Keystore.decrypt(corruptedKeystore1, "password")).toThrow(
				Keystore.InvalidMacError,
			);
			expect(() => Keystore.decrypt(corruptedKeystore2, "password")).toThrow(
				Keystore.InvalidMacError,
			);
		});
	});

	describe("parameter validation (forged keystores)", () => {
		const toHex = (b: Uint8Array) =>
			Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
		const ciphertext =
			"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

		const forged = (
			overrides: {
				cipher?: string;
				iv?: string;
				mac?: string;
				dklen?: number;
				kdf?: "scrypt" | "pbkdf2";
			} = {},
		): Keystore.KeystoreV3 => {
			const kdf = overrides.kdf ?? "scrypt";
			const dklen = overrides.dklen ?? 32;
			return {
				version: 3,
				id: "forged",
				crypto: {
					cipher: (overrides.cipher ?? "aes-128-ctr") as "aes-128-ctr",
					ciphertext,
					cipherparams: { iv: overrides.iv ?? "00".repeat(16) },
					kdf,
					kdfparams:
						kdf === "scrypt"
							? { dklen, n: 1024, r: 1, p: 1, salt: "11".repeat(32) }
							: { dklen, c: 1, prf: "hmac-sha256", salt: "11".repeat(32) },
					// MAC with an empty MAC key: keccak256(ciphertext)
					mac:
						overrides.mac ??
						toHex(keccak_256(Uint8Array.from(Buffer.from(ciphertext, "hex")))),
				},
			} as Keystore.KeystoreV3;
		};

		it("rejects dklen 16 (empty MAC key bypass) for scrypt", () => {
			expect(() => Keystore.decrypt(forged({ dklen: 16 }), "any")).toThrow(
				Keystore.DecryptionError,
			);
		});

		it("rejects dklen 16 (empty MAC key bypass) for pbkdf2", () => {
			expect(() =>
				Keystore.decrypt(forged({ dklen: 16, kdf: "pbkdf2" }), "any"),
			).toThrow(Keystore.DecryptionError);
		});

		it("rejects dklen 31 and non-integer dklen", () => {
			expect(() => Keystore.decrypt(forged({ dklen: 31 }), "x")).toThrow(
				/dklen/,
			);
			expect(() => Keystore.decrypt(forged({ dklen: 32.5 }), "x")).toThrow(
				/dklen/,
			);
		});

		it("rejects unsupported cipher", () => {
			expect(() =>
				Keystore.decrypt(forged({ cipher: "aes-128-cbc" }), "x"),
			).toThrow(/Unsupported cipher/);
		});

		it.each(["scrypt", "pbkdf2"] as const)(
			"rejects dklen above 128 before running %s",
			(kdf) => {
				// 2^31 bytes would take gigabytes and minutes if the KDF ran.
				for (const dklen of [129, 2 ** 31, Number.MAX_SAFE_INTEGER]) {
					const start = performance.now();
					expect(() => Keystore.decrypt(forged({ dklen, kdf }), "x")).toThrow(
						Keystore.DecryptionError,
					);
					expect(() => Keystore.decrypt(forged({ dklen, kdf }), "x")).toThrow(
						/dklen must be an integer between 32 and 128/,
					);
					expect(performance.now() - start).toBeLessThan(1000);
				}
			},
		);

		it("accepts dklen 128 up to MAC verification", () => {
			expect(() => Keystore.decrypt(forged({ dklen: 128 }), "x")).toThrow(
				Keystore.InvalidMacError,
			);
		});

		it("rejects IV that is not 16 bytes", () => {
			expect(() =>
				Keystore.decrypt(forged({ iv: "00".repeat(8) }), "x"),
			).toThrow(/IV must be 16 bytes/);
			expect(() =>
				Keystore.decrypt(forged({ iv: "00".repeat(32) }), "x"),
			).toThrow(/IV must be 16 bytes/);
		});

		it("rejects MAC that is not 32 bytes", () => {
			expect(() =>
				Keystore.decrypt(forged({ mac: "00".repeat(16) }), "x"),
			).toThrow(/MAC must be 32 bytes/);
			expect(() => Keystore.decrypt(forged({ mac: "" }), "x")).toThrow(
				/MAC must be 32 bytes/,
			);
		});

		it("still reports InvalidMacError for a well-formed keystore with wrong MAC", () => {
			expect(() => Keystore.decrypt(forged(), "x")).toThrow(
				Keystore.InvalidMacError,
			);
		});
	});

	describe("performance", () => {
		it("scrypt with low parameters is fast", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const start = Date.now();
			const keystore = await Keystore.encrypt(privateKey, "password", {
				scryptN: 1024,
				scryptR: 1,
				scryptP: 1,
			});
			const decrypted = Keystore.decrypt(keystore, "password");
			const elapsed = Date.now() - start;

			expect(decrypted).toEqual(privateKey);
			expect(elapsed).toBeLessThan(3000); // Should complete quickly even under CI v8 coverage
		});

		it("pbkdf2 with low iterations is fast", async () => {
			const privateKey = PrivateKey.from(
				"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
			);

			const start = Date.now();
			const keystore = await Keystore.encrypt(privateKey, "password", {
				kdf: "pbkdf2",
				pbkdf2C: 10000,
			});
			const decrypted = Keystore.decrypt(keystore, "password");
			const elapsed = Date.now() - start;

			expect(decrypted).toEqual(privateKey);
			expect(elapsed).toBeLessThan(2000); // Should complete quickly even under CI v8 coverage
		});
	});
});

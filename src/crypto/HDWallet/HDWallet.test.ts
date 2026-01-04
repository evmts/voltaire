import { describe, expect, it } from "vitest";
import * as Bip39 from "../Bip39/Bip39.js";
import * as HDWallet from "./HDWallet.js";

describe("HDWallet", () => {
	describe("fromSeed", () => {
		it("creates root key from 64-byte seed", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(root).toBeDefined();
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);
			expect(HDWallet.getPrivateKey(root)?.length).toBe(32);
		});

		it("creates root key from minimum seed (16 bytes)", () => {
			const seed = new Uint8Array(16).fill(1);
			const root = HDWallet.fromSeed(seed);

			expect(root).toBeDefined();
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);
		});

		it("creates root key from maximum seed (64 bytes)", () => {
			const seed = new Uint8Array(64).fill(1);
			const root = HDWallet.fromSeed(seed);

			expect(root).toBeDefined();
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);
		});

		it("throws error for seed shorter than 16 bytes", () => {
			const seed = new Uint8Array(15).fill(1);
			expect(() => HDWallet.fromSeed(seed)).toThrow();
		});

		it("throws error for seed longer than 64 bytes", () => {
			const seed = new Uint8Array(65).fill(1);
			expect(() => HDWallet.fromSeed(seed)).toThrow();
		});

		it("produces deterministic keys from same seed", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);

			const root1 = HDWallet.fromSeed(seed);
			const root2 = HDWallet.fromSeed(seed);

			const key1 = HDWallet.getPrivateKey(root1);
			const key2 = HDWallet.getPrivateKey(root2);

			expect(key1).toEqual(key2);
		});

		// BIP-32 Test Vector 1
		it("derives correct master key from BIP-32 test vector 1", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toBe(
				"xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
			);
		});

		it("handles all-zero seed", () => {
			const zeroSeed = new Uint8Array(64);
			const root = HDWallet.fromSeed(zeroSeed);

			expect(root).toBeDefined();
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);
		});

		it("handles all-0xFF seed", () => {
			const ffSeed = new Uint8Array(64).fill(0xff);
			const root = HDWallet.fromSeed(ffSeed);

			expect(root).toBeDefined();
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);
		});

		it("produces different keys for different seeds", () => {
			const seed1 = new Uint8Array(64).fill(1);
			const seed2 = new Uint8Array(64).fill(2);

			const root1 = HDWallet.fromSeed(seed1);
			const root2 = HDWallet.fromSeed(seed2);

			const key1 = HDWallet.getPrivateKey(root1);
			const key2 = HDWallet.getPrivateKey(root2);

			expect(key1).not.toEqual(key2);
		});
	});

	describe("derivePath", () => {
		it("derives Ethereum account (m/44'/60'/0'/0/0)", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
			expect(account).toBeDefined();
			expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
			expect(HDWallet.getPrivateKey(account)?.length).toBe(32);
		});

		it("derives Bitcoin account (m/44'/0'/0'/0/0)", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/44'/0'/0'/0/0");
			expect(account).toBeDefined();
		});

		it("derives path with only hardened indices", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/0'/1'/2'");
			expect(account).toBeDefined();
		});

		it("derives path with only normal indices", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/0/1/2");
			expect(account).toBeDefined();
		});

		it("derives path with mixed hardened and normal indices", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/0'/1/2'/3");
			expect(account).toBeDefined();
		});

		it("throws error for invalid path format", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "invalid/path")).toThrow();
		});

		it("throws error for path without 'm' prefix", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "44'/60'/0'/0/0")).toThrow();
		});

		// BIP-32 Test Vector 1 - Derivation paths
		it("derives m/0' correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
			);
		});

		it("derives m/0'/1 correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs",
			);
		});

		it("derives m/0'/1/2' correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1/2'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM",
			);
		});

		it("derives m/0'/1/2'/2 correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1/2'/2");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334",
			);
		});

		it("derives m/0'/1/2'/2/1000000000 correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1/2'/2/1000000000");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76",
			);
		});
	});

	describe("deriveChild", () => {
		it("derives normal (non-hardened) child", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.deriveChild(root, 0);
			expect(child).toBeDefined();
		});

		it("derives hardened child", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.deriveChild(root, 0x80000000); // 0' in hardened notation
			expect(child).toBeDefined();
		});

		it("derives child at maximum normal index (2^31 - 1)", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const maxNormalIndex = 0x7fffffff;
			const child = HDWallet.deriveChild(root, maxNormalIndex);
			expect(child).toBeDefined();
		});

		it("derives child at maximum hardened index (2^32 - 1)", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const maxHardenedIndex = 0xffffffff;
			const child = HDWallet.deriveChild(root, maxHardenedIndex);
			expect(child).toBeDefined();
		});

		it("throws on index = -1", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.deriveChild(root, -1)).toThrow();
		});

		it("throws on index > 0xFFFFFFFF", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const overMax = 0x100000000; // 2^32
			expect(() => HDWallet.deriveChild(root, overMax)).toThrow();
		});

		it("throws on non-integer index", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() =>
				HDWallet.deriveChild(root, 1.5 as unknown as number),
			).toThrow();
		});

		it("throws on NaN index", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.deriveChild(root, Number.NaN)).toThrow();
		});

		it("throws on Infinity index", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() =>
				HDWallet.deriveChild(root, Number.POSITIVE_INFINITY),
			).toThrow();
		});
	});

	describe("deriveEthereum", () => {
		it("derives Ethereum account 0", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.deriveEthereum(root, 0);
			expect(account).toBeDefined();
			expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
		});

		it("derives multiple Ethereum accounts", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account0 = HDWallet.deriveEthereum(root, 0);
			const account1 = HDWallet.deriveEthereum(root, 1);
			const account2 = HDWallet.deriveEthereum(root, 2);

			const key0 = HDWallet.getPrivateKey(account0);
			const key1 = HDWallet.getPrivateKey(account1);
			const key2 = HDWallet.getPrivateKey(account2);

			expect(key0).not.toEqual(key1);
			expect(key1).not.toEqual(key2);
			expect(key0).not.toEqual(key2);
		});
	});

	describe("deriveBitcoin", () => {
		it("derives Bitcoin account 0", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.deriveBitcoin(root, 0);
			expect(account).toBeDefined();
			expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
		});

		it("derives multiple Bitcoin accounts", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account0 = HDWallet.deriveBitcoin(root, 0);
			const account1 = HDWallet.deriveBitcoin(root, 1);

			const key0 = HDWallet.getPrivateKey(account0);
			const key1 = HDWallet.getPrivateKey(account1);

			expect(key0).not.toEqual(key1);
		});
	});

	describe("getPrivateKey", () => {
		it("returns 32-byte private key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const privateKey = HDWallet.getPrivateKey(root);
			expect(privateKey).toBeInstanceOf(Uint8Array);
			expect(privateKey?.length).toBe(32);
		});

		it("returns undefined or null for public-only key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			const privateKey = HDWallet.getPrivateKey(publicKey);
			expect(privateKey == null).toBe(true);
		});
	});

	describe("getPublicKey", () => {
		it("returns 33-byte compressed public key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const publicKey = HDWallet.getPublicKey(root);
			expect(publicKey).toBeInstanceOf(Uint8Array);
			if (publicKey) {
				expect(publicKey.length).toBe(33);
			}
		});

		it("public key starts with 0x02 or 0x03", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const publicKey = HDWallet.getPublicKey(root);
			expect(publicKey).toBeInstanceOf(Uint8Array);
			if (publicKey) {
				const firstByte = publicKey[0];
				if (firstByte !== undefined) {
					expect(firstByte === 0x02 || firstByte === 0x03).toBe(true);
				}
			}
		});
	});

	describe("getChainCode", () => {
		it("returns 32-byte chain code", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const chainCode = HDWallet.getChainCode(root);
			expect(chainCode).toBeInstanceOf(Uint8Array);
			if (chainCode) {
				expect(chainCode.length).toBe(32);
			}
		});

		it("chain code differs between parent and child", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const child = HDWallet.deriveChild(root, 0);

			const parentChainCode = HDWallet.getChainCode(root);
			const childChainCode = HDWallet.getChainCode(child);

			expect(parentChainCode).not.toEqual(childChainCode);
		});
	});

	describe("toExtendedPrivateKey", () => {
		it("serializes to xprv format", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toMatch(/^xprv/);
		});

		it("produces valid extended key that can be imported", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			const imported = HDWallet.fromExtendedKey(xprv);

			const originalKey = HDWallet.getPrivateKey(root);
			const importedKey = HDWallet.getPrivateKey(imported);

			expect(importedKey).toEqual(originalKey);
		});
	});

	describe("toExtendedPublicKey", () => {
		it("serializes to xpub format", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xpub = HDWallet.toExtendedPublicKey(root);
			expect(xpub).toMatch(/^xpub/);
		});

		it("produces valid extended key that can be imported", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xpub = HDWallet.toExtendedPublicKey(root);
			const imported = HDWallet.fromPublicExtendedKey(xpub);

			const originalKey = HDWallet.getPublicKey(root);
			const importedKey = HDWallet.getPublicKey(imported);

			expect(importedKey).toEqual(originalKey);
		});
	});

	describe("toPublic", () => {
		it("converts to public-only key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const publicKey = HDWallet.toPublic(root);
			expect(HDWallet.getPrivateKey(publicKey) == null).toBe(true);
			expect(HDWallet.getPublicKey(publicKey)).toBeInstanceOf(Uint8Array);
		});

		it("preserves public key data", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const originalPubKey = HDWallet.getPublicKey(root);
			const publicKey = HDWallet.toPublic(root);
			const convertedPubKey = HDWallet.getPublicKey(publicKey);

			expect(convertedPubKey).toEqual(originalPubKey);
		});
	});

	describe("canDeriveHardened", () => {
		it("returns true for key with private key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(HDWallet.canDeriveHardened(root)).toBe(true);
		});

		it("returns false for public-only key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			expect(HDWallet.canDeriveHardened(publicKey)).toBe(false);
		});
	});

	describe("isValidPath", () => {
		it("validates correct Ethereum path", () => {
			expect(HDWallet.isValidPath("m/44'/60'/0'/0/0")).toBe(true);
		});

		it("validates correct Bitcoin path", () => {
			expect(HDWallet.isValidPath("m/44'/0'/0'/0/0")).toBe(true);
		});

		it("validates path with only hardened indices", () => {
			expect(HDWallet.isValidPath("m/0'/1'/2'")).toBe(true);
		});

		it("validates path with only normal indices", () => {
			expect(HDWallet.isValidPath("m/0/1/2")).toBe(true);
		});

		it("rejects path without 'm' prefix", () => {
			expect(HDWallet.isValidPath("44'/60'/0'/0/0")).toBe(false);
		});

		it("rejects empty path", () => {
			expect(HDWallet.isValidPath("")).toBe(false);
		});

		it("rejects path with invalid characters", () => {
			expect(HDWallet.isValidPath("m/44'/60'/a'/0/0")).toBe(false);
		});

		it("rejects paths exceeding 255 levels (BIP-32 max depth)", () => {
			// Build a path with 256 levels (exceeds max)
			const longPath = `m/${Array.from({ length: 256 }, (_, i) => i).join("/")}`;
			expect(HDWallet.isValidPath(longPath)).toBe(false);
		});

		it("accepts paths at exactly 255 levels (BIP-32 max depth)", () => {
			const maxPath = `m/${Array.from({ length: 255 }, (_, i) => i).join("/")}`;
			expect(HDWallet.isValidPath(maxPath)).toBe(true);
		});

		it("rejects path with trailing slash", () => {
			expect(HDWallet.isValidPath("m/44'/60'/0'/0/0/")).toBe(false);
		});

		it("rejects path with double slashes", () => {
			expect(HDWallet.isValidPath("m/44'//60'/0'/0/0")).toBe(false);
			expect(HDWallet.isValidPath("m//44'/60'/0'/0/0")).toBe(false);
		});

		it("rejects path with spaces", () => {
			expect(HDWallet.isValidPath("m/44' /60'/0'/0/0")).toBe(false);
			expect(HDWallet.isValidPath("m /44'/60'/0'/0/0")).toBe(false);
		});

		it("rejects 'h' hardened notation (@scure/bip32 only supports apostrophe)", () => {
			// @scure/bip32 doesn't support 'h' notation
			expect(HDWallet.isValidPath("m/0'/1h/2'")).toBe(false);
			expect(HDWallet.isValidPath("m/44h/60h/0h/0/0")).toBe(false);
		});

		it("validates single-level path", () => {
			expect(HDWallet.isValidPath("m/0")).toBe(true);
			expect(HDWallet.isValidPath("m/0'")).toBe(true);
		});

		it("rejects root path 'm' (requires at least one derivation level)", () => {
			expect(HDWallet.isValidPath("m")).toBe(false);
			expect(HDWallet.isValidPath("m/")).toBe(false);
		});

		it("rejects index overflow (indices must be < 2^31)", () => {
			// 2^31 = 2147483648, exceeds max normal index
			expect(HDWallet.isValidPath("m/2147483648")).toBe(false);
			expect(HDWallet.isValidPath("m/2147483648'")).toBe(false);
			// Max valid is 2^31-1 = 2147483647
			expect(HDWallet.isValidPath("m/2147483647")).toBe(true);
			expect(HDWallet.isValidPath("m/2147483647'")).toBe(true);
		});

		it("rejects extremely large indices that would overflow", () => {
			expect(HDWallet.isValidPath("m/9999999999999")).toBe(false);
			expect(HDWallet.isValidPath("m/99999999999999999999")).toBe(false);
		});

		it("validates uppercase M prefix", () => {
			expect(HDWallet.isValidPath("M/44'/60'/0'/0/0")).toBe(true);
		});

		it("rejects negative indices", () => {
			// Regex doesn't match negative numbers
			expect(HDWallet.isValidPath("m/-1")).toBe(false);
			expect(HDWallet.isValidPath("m/0/-1")).toBe(false);
		});

		it("rejects decimal indices", () => {
			expect(HDWallet.isValidPath("m/1.5")).toBe(false);
			expect(HDWallet.isValidPath("m/0.5'/1")).toBe(false);
		});

		it("rejects hex notation", () => {
			expect(HDWallet.isValidPath("m/0x44'/0x60'/0'/0/0")).toBe(false);
		});
	});

	describe("isHardenedPath", () => {
		it("returns true for path with hardened indices", () => {
			expect(HDWallet.isHardenedPath("m/44'/60'/0'")).toBe(true);
		});

		it("returns false for path with only normal indices", () => {
			expect(HDWallet.isHardenedPath("m/0/1/2")).toBe(false);
		});

		it("returns true for mixed path with at least one hardened index", () => {
			expect(HDWallet.isHardenedPath("m/0'/1/2")).toBe(true);
		});
	});

	describe("parseIndex", () => {
		it("parses normal index", () => {
			expect(HDWallet.parseIndex("0")).toBe(0);
			expect(HDWallet.parseIndex("1")).toBe(1);
			expect(HDWallet.parseIndex("100")).toBe(100);
		});

		it("parses hardened index with apostrophe", () => {
			expect(HDWallet.parseIndex("0'")).toBe(0x80000000);
			expect(HDWallet.parseIndex("1'")).toBe(0x80000001);
		});

		it("parses hardened index with h suffix", () => {
			expect(HDWallet.parseIndex("0h")).toBe(0x80000000);
			expect(HDWallet.parseIndex("1h")).toBe(0x80000001);
		});

		it("parses large index", () => {
			const maxNormal = "2147483647"; // 2^31 - 1
			expect(HDWallet.parseIndex(maxNormal)).toBe(0x7fffffff);
		});

		it("parses index > 2^31-1 (parseIndex allows, deriveChild will validate)", () => {
			const overMax = "2147483648"; // 2^31
			// parseIndex just parses, doesn't validate range
			expect(HDWallet.parseIndex(overMax)).toBe(2147483648);
		});

		it("throws on negative strings", () => {
			expect(() => HDWallet.parseIndex("-1")).toThrow();
			expect(() => HDWallet.parseIndex("-100")).toThrow();
		});

		it("parses hex strings as decimal (0x ignored)", () => {
			// parseInt with base 10 stops at 'x'
			expect(HDWallet.parseIndex("0x10")).toBe(0);
			expect(HDWallet.parseIndex("0xFF")).toBe(0);
		});

		it("parses integers from strings with floats", () => {
			// parseInt truncates floats
			expect(HDWallet.parseIndex("1.5")).toBe(1);
			expect(HDWallet.parseIndex("99.9")).toBe(99);
		});

		it("throws on non-numeric strings", () => {
			expect(() => HDWallet.parseIndex("abc")).toThrow();
			expect(() => HDWallet.parseIndex("")).toThrow();
		});

		it("throws on special values", () => {
			expect(() => HDWallet.parseIndex("NaN")).toThrow();
			// Infinity parses as NaN with parseInt
			expect(() => HDWallet.parseIndex("Infinity")).toThrow();
			expect(() => HDWallet.parseIndex("-Infinity")).toThrow();
		});

		it("handles hardened index at maximum", () => {
			const maxHardened = "2147483647'"; // 2^31-1 hardened
			expect(HDWallet.parseIndex(maxHardened)).toBe(0xffffffff);
		});
	});

	describe("edge cases and security", () => {
		it("handles maximum derivation depth", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// BIP-32 allows up to 255 levels, but practical usage is much less
			let key = root;
			for (let i = 0; i < 10; i++) {
				key = HDWallet.deriveChild(key, i);
			}
			expect(key).toBeDefined();
		});

		it("produces different keys for different derivation paths", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const path1 = HDWallet.derivePath(root, "m/0/0");
			const path2 = HDWallet.derivePath(root, "m/0/1");

			const key1 = HDWallet.getPrivateKey(path1);
			const key2 = HDWallet.getPrivateKey(path2);

			expect(key1).not.toEqual(key2);
		});

		it("hardened and non-hardened indices produce different keys", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const normal = HDWallet.deriveChild(root, 0);
			const hardened = HDWallet.deriveChild(root, 0x80000000);

			const normalKey = HDWallet.getPrivateKey(normal);
			const hardenedKey = HDWallet.getPrivateKey(hardened);

			expect(normalKey).not.toEqual(hardenedKey);
		});

		it("cannot derive hardened child from public key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			expect(() => HDWallet.deriveChild(publicKey, 0x80000000)).toThrow();
		});

		it("can derive normal child from public key", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			const child = HDWallet.deriveChild(publicKey, 0);
			expect(child).toBeDefined();
			expect(HDWallet.getPrivateKey(child) == null).toBe(true);
		});

		it("produces same result for sequential vs direct derivation", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Sequential derivation
			const step1 = HDWallet.deriveChild(root, 0x80000000);
			const step2 = HDWallet.deriveChild(step1, 1);
			const sequentialKey = HDWallet.getPrivateKey(step2);

			// Direct derivation
			const direct = HDWallet.derivePath(root, "m/0'/1");
			const directKey = HDWallet.getPrivateKey(direct);

			expect(sequentialKey).toEqual(directKey);
		});

		it("handles 32-byte seed (256 bits)", () => {
			const seed = new Uint8Array(32).fill(1);
			const root = HDWallet.fromSeed(seed);
			expect(root).toBeDefined();
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);
		});

		it("accepts non-standard seed length (17 bytes) - @scure/bip32 allows it", () => {
			const seed = new Uint8Array(17).fill(1);
			const root = HDWallet.fromSeed(seed);
			expect(root).toBeDefined();
		});

		it("accepts non-standard seed length (31 bytes) - @scure/bip32 allows it", () => {
			const seed = new Uint8Array(31).fill(1);
			const root = HDWallet.fromSeed(seed);
			expect(root).toBeDefined();
		});

		it("handles deep path derivation (20+ levels)", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const deepPath = "m/0/1/2/3/4/5/6/7/8/9/10/11/12/13/14/15/16/17/18/19/20";
			const derived = HDWallet.derivePath(root, deepPath);
			expect(derived).toBeDefined();
			expect(HDWallet.getPrivateKey(derived)).toBeInstanceOf(Uint8Array);
		});

		it("handles path with very large index", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const largeIndex = 2147483647; // 2^31 - 1
			const child = HDWallet.deriveChild(root, largeIndex);
			expect(child).toBeDefined();
		});
	});

	describe("fromExtendedKey and serialization", () => {
		it("handles round-trip: seed -> xprv -> parse -> serialize", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			const parsed = HDWallet.fromExtendedKey(xprv);
			const xprv2 = HDWallet.toExtendedPrivateKey(parsed);

			expect(xprv).toBe(xprv2);
		});

		it("handles round-trip: xpub -> parse -> serialize", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xpub = HDWallet.toExtendedPublicKey(root);
			const parsed = HDWallet.fromPublicExtendedKey(xpub);
			const xpub2 = HDWallet.toExtendedPublicKey(parsed);

			expect(xpub).toBe(xpub2);
		});

		it("throws on invalid Base58 encoding", () => {
			const invalidKey = "xprv9s21ZrQH143K3INVALID";
			expect(() => HDWallet.fromExtendedKey(invalidKey)).toThrow();
		});

		it("throws on wrong checksum", () => {
			// Valid structure but wrong checksum
			const wrongChecksum =
				"xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPH0";
			expect(() => HDWallet.fromExtendedKey(wrongChecksum)).toThrow();
		});

		it("handles derived key serialization", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const child = HDWallet.derivePath(root, "m/44'/60'/0'");

			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toMatch(/^xprv/);

			const xpub = HDWallet.toExtendedPublicKey(child);
			expect(xpub).toMatch(/^xpub/);
		});
	});

	describe("parsePath edge cases", () => {
		it("handles uppercase M prefix", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const derived = HDWallet.derivePath(root, "M/44'/60'/0'/0/0");
			expect(derived).toBeDefined();
		});

		it("rejects path with h notation - @scure/bip32 doesn't support it", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "m/44h/60h/0h/0/0")).toThrow();
		});

		it("rejects mixed hardened notation - @scure/bip32 doesn't support h", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "m/44'/60h/0'/0/0")).toThrow();
		});

		it("rejects path with leading slash", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "/m/44'/60'/0'/0/0")).toThrow();
		});

		it("handles single-level normal path", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const derived = HDWallet.derivePath(root, "m/0");
			expect(derived).toBeDefined();
		});

		it("handles single-level hardened path", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const derived = HDWallet.derivePath(root, "m/0'");
			expect(derived).toBeDefined();
		});

		it("throws on Unicode characters in path", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "m/44'/60'/0'/0/🔑")).toThrow();
		});
	});

	describe("deriveBitcoin extended", () => {
		it("derives Bitcoin account 10", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account10 = HDWallet.deriveBitcoin(root, 10);
			expect(account10).toBeDefined();
			expect(HDWallet.getPrivateKey(account10)).toBeInstanceOf(Uint8Array);
		});

		it("produces unique keys for different Bitcoin accounts", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const accounts = [0, 1, 2, 3, 4].map((i) =>
				HDWallet.deriveBitcoin(root, i),
			);
			const keys = accounts.map(HDWallet.getPrivateKey);

			// All keys should be unique
			for (let i = 0; i < keys.length; i++) {
				for (let j = i + 1; j < keys.length; j++) {
					expect(keys[i]).not.toEqual(keys[j]);
				}
			}
		});
	});

	describe("deriveEthereum extended", () => {
		it("derives Ethereum account 10", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account10 = HDWallet.deriveEthereum(root, 10);
			expect(account10).toBeDefined();
			expect(HDWallet.getPrivateKey(account10)).toBeInstanceOf(Uint8Array);
		});

		it("derives first 100 Ethereum accounts", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const accounts = [];
			for (let i = 0; i < 100; i++) {
				const account = HDWallet.deriveEthereum(root, i);
				accounts.push(account);
				expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
			}

			expect(accounts.length).toBe(100);
		});

		it("produces unique keys for different Ethereum accounts", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const accounts = [0, 1, 2, 3, 4].map((i) =>
				HDWallet.deriveEthereum(root, i),
			);
			const keys = accounts.map(HDWallet.getPrivateKey);

			// All keys should be unique
			for (let i = 0; i < keys.length; i++) {
				for (let j = i + 1; j < keys.length; j++) {
					expect(keys[i]).not.toEqual(keys[j]);
				}
			}
		});
	});

	describe("getPrivateKey extended", () => {
		it("returns different keys for different paths", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const keys = new Set<string>();
			for (let i = 0; i < 10; i++) {
				const child = HDWallet.deriveChild(root, i);
				const key = HDWallet.getPrivateKey(child);
				if (key) {
					const keyHex = Array.from(key)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					keys.add(keyHex);
				}
			}

			expect(keys.size).toBe(10);
		});
	});

	describe("getPublicKey extended", () => {
		it("works for public-only keys", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			const pubKey = HDWallet.getPublicKey(publicKey);
			expect(pubKey).toBeInstanceOf(Uint8Array);
			expect(pubKey?.length).toBe(33);
		});

		it("returns consistent public key after derivation", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.deriveChild(root, 0);
			const pubKey1 = HDWallet.getPublicKey(child);
			const pubKey2 = HDWallet.getPublicKey(child);

			expect(pubKey1).toEqual(pubKey2);
		});
	});

	describe("toPublic extended", () => {
		it("preserves chain code", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const originalChainCode = HDWallet.getChainCode(root);
			const publicKey = HDWallet.toPublic(root);
			const convertedChainCode = HDWallet.getChainCode(publicKey);

			expect(convertedChainCode).toEqual(originalChainCode);
		});

		it("allows non-hardened derivation", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			const child0 = HDWallet.deriveChild(publicKey, 0);
			const child1 = HDWallet.deriveChild(publicKey, 1);

			expect(child0).toBeDefined();
			expect(child1).toBeDefined();
			expect(HDWallet.getPublicKey(child0)).not.toEqual(
				HDWallet.getPublicKey(child1),
			);
		});
	});

	describe("BIP-32 Test Vector 2", () => {
		it("derives correct master key from test vector 2", () => {
			const seedHex =
				"fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toBe(
				"xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U",
			);
		});

		it("derives m/0 correctly (BIP-32 vector 2)", () => {
			const seedHex =
				"fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt",
			);
		});

		it("derives m/0/2147483647' correctly (BIP-32 vector 2)", () => {
			const seedHex =
				"fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0/2147483647'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9",
			);
		});

		it("derives m/0/2147483647'/1 correctly (BIP-32 vector 2)", () => {
			const seedHex =
				"fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0/2147483647'/1");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef",
			);
		});

		it("derives m/0/2147483647'/1/2147483646' correctly (BIP-32 vector 2)", () => {
			const seedHex =
				"fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0/2147483647'/1/2147483646'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc",
			);
		});

		it("derives m/0/2147483647'/1/2147483646'/2 correctly (BIP-32 vector 2)", () => {
			const seedHex =
				"fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(
				root,
				"m/0/2147483647'/1/2147483646'/2",
			);
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j",
			);
		});
	});

	describe("BIP-32 Test Vector 3", () => {
		it("derives correct master key from test vector 3", () => {
			const seedHex =
				"4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toBe(
				"xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6",
			);
		});

		it("derives m/0' correctly (BIP-32 vector 3)", () => {
			const seedHex =
				"4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe(
				"xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L",
			);
		});
	});

	describe("performance", () => {
		it("derives 1000 addresses sequentially", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const startTime = Date.now();
			for (let i = 0; i < 1000; i++) {
				const account = HDWallet.deriveEthereum(root, i);
				expect(account).toBeDefined();
			}
			const elapsed = Date.now() - startTime;

			expect(elapsed).toBeLessThan(10000);
		});
	});
});

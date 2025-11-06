import { describe, expect, it } from "vitest";
import * as Bip39 from "../Bip39/Bip39.js";
import * as HDWallet from "./HDWallet.js";

describe("HDWallet", () => {
	describe("fromSeed", () => {
		it("creates root key from 64-byte seed", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const seed = new Uint8Array(seedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toBe("xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi");
		});
	});

	describe("derivePath", () => {
		it("derives Ethereum account (m/44'/60'/0'/0/0)", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
			expect(account).toBeDefined();
			expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
			expect(HDWallet.getPrivateKey(account)?.length).toBe(32);
		});

		it("derives Bitcoin account (m/44'/0'/0'/0/0)", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/44'/0'/0'/0/0");
			expect(account).toBeDefined();
		});

		it("derives path with only hardened indices", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/0'/1'/2'");
			expect(account).toBeDefined();
		});

		it("derives path with only normal indices", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/0/1/2");
			expect(account).toBeDefined();
		});

		it("derives path with mixed hardened and normal indices", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/0'/1/2'/3");
			expect(account).toBeDefined();
		});

		it("throws error for invalid path format", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "invalid/path")).toThrow();
		});

		it("throws error for path without 'm' prefix", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(() => HDWallet.derivePath(root, "44'/60'/0'/0/0")).toThrow();
		});

		// BIP-32 Test Vector 1 - Derivation paths
		it("derives m/0' correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(seedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe("xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7");
		});

		it("derives m/0'/1 correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(seedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe("xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs");
		});

		it("derives m/0'/1/2' correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(seedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1/2'");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe("xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM");
		});

		it("derives m/0'/1/2'/2 correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(seedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1/2'/2");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe("xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334");
		});

		it("derives m/0'/1/2'/2/1000000000 correctly (BIP-32 vector 1)", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(seedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.derivePath(root, "m/0'/1/2'/2/1000000000");
			const xprv = HDWallet.toExtendedPrivateKey(child);
			expect(xprv).toBe("xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76");
		});
	});

	describe("deriveChild", () => {
		it("derives normal (non-hardened) child", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.deriveChild(root, 0);
			expect(child).toBeDefined();
		});

		it("derives hardened child", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const child = HDWallet.deriveChild(root, 0x80000000); // 0' in hardened notation
			expect(child).toBeDefined();
		});

		it("derives child at maximum normal index (2^31 - 1)", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const maxNormalIndex = 0x7FFFFFFF;
			const child = HDWallet.deriveChild(root, maxNormalIndex);
			expect(child).toBeDefined();
		});

		it("derives child at maximum hardened index (2^32 - 1)", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const maxHardenedIndex = 0xFFFFFFFF;
			const child = HDWallet.deriveChild(root, maxHardenedIndex);
			expect(child).toBeDefined();
		});
	});

	describe("deriveEthereum", () => {
		it("derives Ethereum account 0", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.deriveEthereum(root, 0);
			expect(account).toBeDefined();
			expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
		});

		it("derives multiple Ethereum accounts", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.deriveBitcoin(root, 0);
			expect(account).toBeDefined();
			expect(HDWallet.getPrivateKey(account)).toBeInstanceOf(Uint8Array);
		});

		it("derives multiple Bitcoin accounts", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const privateKey = HDWallet.getPrivateKey(root);
			expect(privateKey).toBeInstanceOf(Uint8Array);
			expect(privateKey?.length).toBe(32);
		});

		it("returns undefined for public-only key", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			const privateKey = HDWallet.getPrivateKey(publicKey);
			expect(privateKey).toBeUndefined();
		});
	});

	describe("getPublicKey", () => {
		it("returns 33-byte compressed public key", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const publicKey = HDWallet.getPublicKey(root);
			expect(publicKey).toBeInstanceOf(Uint8Array);
			expect(publicKey.length).toBe(33);
		});

		it("public key starts with 0x02 or 0x03", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const publicKey = HDWallet.getPublicKey(root);
			expect(publicKey[0] === 0x02 || publicKey[0] === 0x03).toBe(true);
		});
	});

	describe("getChainCode", () => {
		it("returns 32-byte chain code", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const chainCode = HDWallet.getChainCode(root);
			expect(chainCode).toBeInstanceOf(Uint8Array);
			expect(chainCode.length).toBe(32);
		});

		it("chain code differs between parent and child", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toMatch(/^xprv/);
		});

		it("produces valid extended key that can be imported", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xpub = HDWallet.toExtendedPublicKey(root);
			expect(xpub).toMatch(/^xpub/);
		});

		it("produces valid extended key that can be imported", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const publicKey = HDWallet.toPublic(root);
			expect(HDWallet.getPrivateKey(publicKey)).toBeUndefined();
			expect(HDWallet.getPublicKey(publicKey)).toBeInstanceOf(Uint8Array);
		});

		it("preserves public key data", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			expect(HDWallet.canDeriveHardened(root)).toBe(true);
		});

		it("returns false for public-only key", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			expect(HDWallet.parseIndex(maxNormal)).toBe(0x7FFFFFFF);
		});
	});

	describe("edge cases and security", () => {
		it("handles maximum derivation depth", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const path1 = HDWallet.derivePath(root, "m/0/0");
			const path2 = HDWallet.derivePath(root, "m/0/1");

			const key1 = HDWallet.getPrivateKey(path1);
			const key2 = HDWallet.getPrivateKey(path2);

			expect(key1).not.toEqual(key2);
		});

		it("hardened and non-hardened indices produce different keys", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const normal = HDWallet.deriveChild(root, 0);
			const hardened = HDWallet.deriveChild(root, 0x80000000);

			const normalKey = HDWallet.getPrivateKey(normal);
			const hardenedKey = HDWallet.getPrivateKey(hardened);

			expect(normalKey).not.toEqual(hardenedKey);
		});

		it("cannot derive hardened child from public key", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			expect(() => HDWallet.deriveChild(publicKey, 0x80000000)).toThrow();
		});

		it("can derive normal child from public key", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const publicKey = HDWallet.toPublic(root);

			const child = HDWallet.deriveChild(publicKey, 0);
			expect(child).toBeDefined();
			expect(HDWallet.getPrivateKey(child)).toBeUndefined();
		});

		it("produces same result for sequential vs direct derivation", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
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
	});
});

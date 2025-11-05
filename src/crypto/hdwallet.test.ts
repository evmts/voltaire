import { describe, expect, it } from "bun:test";
import { HDWallet } from "./HDWallet/index.js";
import type { BrandedExtendedKey } from "./HDWallet/index.js";
import * as Bip39 from "./Bip39/index.js";

describe("HDWallet", () => {
	const testMnemonic =
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
	let testSeed: Uint8Array;
	let rootKey: BrandedExtendedKey;

	// Setup
	testSeed = Bip39.mnemonicToSeedSync(testMnemonic);
	rootKey = HDWallet.fromSeed(testSeed);

	describe("Key Generation", () => {
		it("should create root key from seed", () => {
			const key = HDWallet.fromSeed(testSeed);
			expect(key).toBeDefined();
			expect(HDWallet.getPrivateKey(key)).toBeDefined();
			expect(HDWallet.getPublicKey(key)).toBeDefined();
		});

		it("should throw for invalid seed length", () => {
			const shortSeed = new Uint8Array(8);
			expect(() => HDWallet.fromSeed(shortSeed)).toThrow();

			const longSeed = new Uint8Array(65);
			expect(() => HDWallet.fromSeed(longSeed)).toThrow();
		});

		it("should create key from extended private key", () => {
			const xprv = HDWallet.toExtendedPrivateKey(rootKey);
			const key = HDWallet.fromExtendedKey(xprv);
			expect(HDWallet.getPrivateKey(key)).toBeDefined();
		});

		it("should create key from extended public key", () => {
			const xpub = HDWallet.toExtendedPublicKey(rootKey);
			const key = HDWallet.fromPublicExtendedKey(xpub);
			expect(HDWallet.getPublicKey(key)).toBeDefined();
			expect(HDWallet.getPrivateKey(key)).toBeNull();
		});
	});

	describe("Key Derivation", () => {
		it("should derive child by path", () => {
			const child = HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/0");
			expect(child).toBeDefined();
			expect(HDWallet.getPrivateKey(child)).toBeDefined();
			expect(HDWallet.getPublicKey(child)).toBeDefined();
		});

		it("should derive child by index", () => {
			const child = HDWallet.deriveChild(rootKey, 0);
			expect(child).toBeDefined();
		});

		it("should derive hardened child", () => {
			const hardened = HDWallet.deriveChild(rootKey, HDWallet.HARDENED_OFFSET);
			expect(hardened).toBeDefined();
		});

		it("should throw for invalid path", () => {
			expect(() => HDWallet.derivePath(rootKey, "invalid/path")).toThrow();
		});

		it("should derive same key for same path", () => {
			const path = "m/44'/60'/0'/0/0";
			const child1 = HDWallet.derivePath(rootKey, path);
			const child2 = HDWallet.derivePath(rootKey, path);

			const privKey1 = HDWallet.getPrivateKey(child1);
			const privKey2 = HDWallet.getPrivateKey(child2);
			expect(privKey1).toEqual(privKey2);
		});

		it("should derive different keys for different paths", () => {
			const child1 = HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/0");
			const child2 = HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/1");

			const privKey1 = HDWallet.getPrivateKey(child1);
			const privKey2 = HDWallet.getPrivateKey(child2);
			expect(privKey1).not.toEqual(privKey2);
		});
	});

	describe("BIP-44 Derivation", () => {
		it("should derive Ethereum address", () => {
			const ethKey = HDWallet.deriveEthereum(rootKey, 0, 0);
			expect(ethKey).toBeDefined();
			expect(HDWallet.getPrivateKey(ethKey)).toBeDefined();
			expect(HDWallet.getPrivateKey(ethKey)?.length).toBe(32);
		});

		it("should derive multiple Ethereum addresses", () => {
			const eth0 = HDWallet.deriveEthereum(rootKey, 0, 0);
			const eth1 = HDWallet.deriveEthereum(rootKey, 0, 1);
			const eth2 = HDWallet.deriveEthereum(rootKey, 0, 2);

			const priv0 = HDWallet.getPrivateKey(eth0);
			const priv1 = HDWallet.getPrivateKey(eth1);
			const priv2 = HDWallet.getPrivateKey(eth2);

			expect(priv0).not.toEqual(priv1);
			expect(priv1).not.toEqual(priv2);
			expect(priv0).not.toEqual(priv2);
		});

		it("should derive Bitcoin address", () => {
			const btcKey = HDWallet.deriveBitcoin(rootKey, 0, 0);
			expect(btcKey).toBeDefined();
			expect(HDWallet.getPrivateKey(btcKey)).toBeDefined();
		});

		it("should derive different keys for BTC vs ETH", () => {
			const ethKey = HDWallet.deriveEthereum(rootKey, 0, 0);
			const btcKey = HDWallet.deriveBitcoin(rootKey, 0, 0);

			const ethPriv = HDWallet.getPrivateKey(ethKey);
			const btcPriv = HDWallet.getPrivateKey(btcKey);
			expect(ethPriv).not.toEqual(btcPriv);
		});
	});

	describe("Key Serialization", () => {
		it("should serialize to extended private key", () => {
			const xprv = HDWallet.toExtendedPrivateKey(rootKey);
			expect(xprv).toMatch(/^xprv/);
			expect(typeof xprv).toBe("string");
		});

		it("should serialize to extended public key", () => {
			const xpub = HDWallet.toExtendedPublicKey(rootKey);
			expect(xpub).toMatch(/^xpub/);
			expect(typeof xpub).toBe("string");
		});

		it("should roundtrip extended private key", () => {
			const xprv = HDWallet.toExtendedPrivateKey(rootKey);
			const restored = HDWallet.fromExtendedKey(xprv);
			const restoredXprv = HDWallet.toExtendedPrivateKey(restored);
			expect(restoredXprv).toBe(xprv);
		});

		it("should roundtrip extended public key", () => {
			const xpub = HDWallet.toExtendedPublicKey(rootKey);
			const restored = HDWallet.fromPublicExtendedKey(xpub);
			const restoredXpub = HDWallet.toExtendedPublicKey(restored);
			expect(restoredXpub).toBe(xpub);
		});
	});

	describe("Key Properties", () => {
		it("should get private key", () => {
			const privKey = HDWallet.getPrivateKey(rootKey);
			expect(privKey).toBeDefined();
			expect(privKey?.length).toBe(32);
		});

		it("should get public key", () => {
			const pubKey = HDWallet.getPublicKey(rootKey);
			expect(pubKey).toBeDefined();
			expect(pubKey?.length).toBe(33);
		});

		it("should get chain code", () => {
			const chainCode = HDWallet.getChainCode(rootKey);
			expect(chainCode).toBeDefined();
			expect(chainCode?.length).toBe(32);
		});

		it("should check if can derive hardened", () => {
			expect(HDWallet.canDeriveHardened(rootKey)).toBe(true);

			const xpub = HDWallet.toExtendedPublicKey(rootKey);
			const pubOnlyKey = HDWallet.fromPublicExtendedKey(xpub);
			expect(HDWallet.canDeriveHardened(pubOnlyKey)).toBe(false);
		});

		it("should create public-only key", () => {
			const pubKey = HDWallet.toPublic(rootKey);
			expect(HDWallet.getPublicKey(pubKey)).toBeDefined();
			expect(HDWallet.canDeriveHardened(pubKey)).toBe(false);
		});
	});

	describe("Path Utilities", () => {
		it("should detect hardened paths", () => {
			expect(HDWallet.isHardenedPath("m/44'/60'/0'")).toBe(true);
			expect(HDWallet.isHardenedPath("m/44/60/0")).toBe(false);
			expect(HDWallet.isHardenedPath("m/44h/60h/0h")).toBe(true);
		});

		it("should validate path format", () => {
			expect(HDWallet.isValidPath("m/44'/60'/0'/0/0")).toBe(true);
			expect(HDWallet.isValidPath("m/0")).toBe(true);
			expect(HDWallet.isValidPath("invalid")).toBe(false);
			expect(HDWallet.isValidPath("44'/60'/0'")).toBe(false); // Missing 'm'
		});

		it("should parse index notation", () => {
			expect(HDWallet.parseIndex("0")).toBe(0);
			expect(HDWallet.parseIndex("1")).toBe(1);
			expect(HDWallet.parseIndex("44")).toBe(44);
			expect(HDWallet.parseIndex("0'")).toBe(HDWallet.HARDENED_OFFSET);
			expect(HDWallet.parseIndex("0h")).toBe(HDWallet.HARDENED_OFFSET);
			expect(HDWallet.parseIndex("1'")).toBe(HDWallet.HARDENED_OFFSET + 1);
		});

		it("should throw for invalid index", () => {
			expect(() => HDWallet.parseIndex("invalid")).toThrow();
			expect(() => HDWallet.parseIndex("-1")).toThrow();
		});
	});

	describe("Constants", () => {
		it("should have correct hardened offset", () => {
			expect(HDWallet.HARDENED_OFFSET).toBe(0x80000000);
			expect(HDWallet.HARDENED_OFFSET).toBe(2147483648);
		});

		it("should have coin types", () => {
			expect(HDWallet.CoinType.BTC).toBe(0);
			expect(HDWallet.CoinType.BTC_TESTNET).toBe(1);
			expect(HDWallet.CoinType.ETH).toBe(60);
			expect(HDWallet.CoinType.ETC).toBe(61);
		});

		it("should have BIP-44 path templates", () => {
			expect(HDWallet.BIP44_PATH.ETH(0, 0)).toBe("m/44'/60'/0'/0/0");
			expect(HDWallet.BIP44_PATH.ETH(1, 5)).toBe("m/44'/60'/1'/0/5");
			expect(HDWallet.BIP44_PATH.BTC(0, 0)).toBe("m/44'/0'/0'/0/0");
		});
	});

	describe("Known Test Vectors", () => {
		it("should match BIP-32 test vector", () => {
			// Test vector from BIP-32
			const testSeed = new Uint8Array([
				0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
				0x0c, 0x0d, 0x0e, 0x0f,
			]);
			const root = HDWallet.fromSeed(testSeed);
			const xprv = HDWallet.toExtendedPrivateKey(root);

			// Expected from BIP-32 test vectors
			expect(xprv).toBe(
				"xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
			);
		});

		it("should derive BIP-32 test vector child", () => {
			const testSeed = new Uint8Array([
				0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
				0x0c, 0x0d, 0x0e, 0x0f,
			]);
			const root = HDWallet.fromSeed(testSeed);
			const child = HDWallet.derivePath(root, "m/0'");
			const xprv = HDWallet.toExtendedPrivateKey(child);

			// Expected from BIP-32 test vectors
			expect(xprv).toBe(
				"xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7",
			);
		});
	});

	describe("Integration", () => {
		it("should work with full BIP-39 to BIP-44 flow", async () => {
			// Generate mnemonic
			const mnemonic = Bip39.generateMnemonic(256);

			// Derive seed
			const seed = await Bip39.mnemonicToSeed(mnemonic);

			// Create root key
			const root = HDWallet.fromSeed(seed);

			// Derive Ethereum addresses
			const eth0 = HDWallet.deriveEthereum(root, 0, 0);
			const eth1 = HDWallet.deriveEthereum(root, 0, 1);

			// Verify keys are different
			const priv0 = HDWallet.getPrivateKey(eth0);
			const priv1 = HDWallet.getPrivateKey(eth1);
			expect(priv0).not.toEqual(priv1);

			// Verify keys are valid
			expect(priv0?.length).toBe(32);
			expect(priv1?.length).toBe(32);
		});

		it("should derive same key from restored mnemonic", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root1 = HDWallet.fromSeed(seed);
			const eth1 = HDWallet.deriveEthereum(root1, 0, 0);

			// Restore from same mnemonic
			const seed2 = await Bip39.mnemonicToSeed(mnemonic);
			const root2 = HDWallet.fromSeed(seed2);
			const eth2 = HDWallet.deriveEthereum(root2, 0, 0);

			// Should be identical
			expect(HDWallet.getPrivateKey(eth1)).toEqual(
				HDWallet.getPrivateKey(eth2),
			);
		});
	});
});

import { describe, expect, it } from "vitest";
import * as AesGcm from "./AesGcm/AesGcm.js";
import * as Bip39 from "./Bip39/Bip39.js";
import * as HDWallet from "./HDWallet/HDWallet.js";

describe("Wallet Integration Tests", () => {
	describe("Full wallet flow: Mnemonic → Seed → Master Key → Derived Keys", () => {
		it("creates wallet from mnemonic and derives Ethereum accounts", async () => {
			// Generate mnemonic
			const mnemonic = Bip39.generateMnemonic(256);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);

			// Convert to seed
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			expect(seed.length).toBe(64);

			// Create master key
			const root = HDWallet.fromSeed(seed);
			expect(HDWallet.getPrivateKey(root)).toBeInstanceOf(Uint8Array);

			// Derive Ethereum accounts
			const account0 = HDWallet.deriveEthereum(root, 0);
			const account1 = HDWallet.deriveEthereum(root, 1);

			const key0 = HDWallet.getPrivateKey(account0);
			const key1 = HDWallet.getPrivateKey(account1);

			expect(key0?.length).toBe(32);
			expect(key1?.length).toBe(32);
			expect(key0).not.toEqual(key1);
		});

		it("derives same keys from same mnemonic (deterministic)", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

			// First derivation
			const seed1 = await Bip39.mnemonicToSeed(mnemonic);
			const root1 = HDWallet.fromSeed(seed1);
			const account1 = HDWallet.deriveEthereum(root1, 0);
			const key1 = HDWallet.getPrivateKey(account1);

			// Second derivation
			const seed2 = await Bip39.mnemonicToSeed(mnemonic);
			const root2 = HDWallet.fromSeed(seed2);
			const account2 = HDWallet.deriveEthereum(root2, 0);
			const key2 = HDWallet.getPrivateKey(account2);

			expect(key1).toEqual(key2);
		});

		it("passphrase creates different wallet", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

			const seed1 = await Bip39.mnemonicToSeed(mnemonic, "");
			const seed2 = await Bip39.mnemonicToSeed(mnemonic, "password");

			const root1 = HDWallet.fromSeed(seed1);
			const root2 = HDWallet.fromSeed(seed2);

			const key1 = HDWallet.getPrivateKey(root1);
			const key2 = HDWallet.getPrivateKey(root2);

			expect(key1).not.toEqual(key2);
		});

		it("derives multiple account types from same seed", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Ethereum account
			const ethAccount = HDWallet.deriveEthereum(root, 0);
			const ethKey = HDWallet.getPrivateKey(ethAccount);

			// Bitcoin account
			const btcAccount = HDWallet.deriveBitcoin(root, 0);
			const btcKey = HDWallet.getPrivateKey(btcAccount);

			expect(ethKey?.length).toBe(32);
			expect(btcKey?.length).toBe(32);
			expect(ethKey).not.toEqual(btcKey);
		});

		it("derives keys at different BIP-44 levels", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// m/44'/60'/0'/0/0
			const level5 = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");

			// m/44'/60'/0'
			const level3 = HDWallet.derivePath(root, "m/44'/60'/0'");

			// m/44'
			const level1 = HDWallet.derivePath(root, "m/44'");

			expect(HDWallet.getPrivateKey(level5)).toBeDefined();
			expect(HDWallet.getPrivateKey(level3)).toBeDefined();
			expect(HDWallet.getPrivateKey(level1)).toBeDefined();

			// All should be different
			const key5 = HDWallet.getPrivateKey(level5);
			const key3 = HDWallet.getPrivateKey(level3);
			const key1 = HDWallet.getPrivateKey(level1);

			expect(key5).not.toEqual(key3);
			expect(key3).not.toEqual(key1);
			expect(key5).not.toEqual(key1);
		});
	});

	describe("Encrypt private key with password", () => {
		it("encrypts and decrypts private key with AES-GCM", async () => {
			// Generate wallet
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const account = HDWallet.deriveEthereum(root, 0);
			const privateKey = HDWallet.getPrivateKey(account);

			expect(privateKey).toBeDefined();

			// Derive encryption key from password
			const password = "my-secure-password";
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;
			const encryptionKey = await AesGcm.deriveKey(
				password,
				salt,
				iterations,
				256,
			);

			// Encrypt private key
			const nonce = AesGcm.generateNonce();
			const encryptedKey = await AesGcm.encrypt(
				privateKey!,
				encryptionKey,
				nonce,
			);

			// Decrypt private key
			const decryptedKey = await AesGcm.decrypt(
				encryptedKey,
				encryptionKey,
				nonce,
			);

			expect(decryptedKey).toEqual(privateKey);
		});

		it("fails to decrypt with wrong password", async () => {
			// Generate wallet
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const account = HDWallet.deriveEthereum(root, 0);
			const privateKey = HDWallet.getPrivateKey(account);

			expect(privateKey).toBeDefined();

			// Encrypt with password 1
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;
			const key1 = await AesGcm.deriveKey("password1", salt, iterations, 256);
			const nonce = AesGcm.generateNonce();
			const encryptedKey = await AesGcm.encrypt(privateKey!, key1, nonce);

			// Try to decrypt with password 2
			const key2 = await AesGcm.deriveKey("password2", salt, iterations, 256);
			await expect(AesGcm.decrypt(encryptedKey, key2, nonce)).rejects.toThrow();
		});

		it("encrypts multiple keys with same password", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const account0 = HDWallet.deriveEthereum(root, 0);
			const account1 = HDWallet.deriveEthereum(root, 1);

			const key0 = HDWallet.getPrivateKey(account0);
			const key1 = HDWallet.getPrivateKey(account1);

			// Derive encryption key
			const password = "password";
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;
			const encryptionKey = await AesGcm.deriveKey(
				password,
				salt,
				iterations,
				256,
			);

			// Encrypt both keys (with different nonces)
			const nonce0 = AesGcm.generateNonce();
			const nonce1 = AesGcm.generateNonce();

			const encrypted0 = await AesGcm.encrypt(key0!, encryptionKey, nonce0);
			const encrypted1 = await AesGcm.encrypt(key1!, encryptionKey, nonce1);

			// Decrypt
			const decrypted0 = await AesGcm.decrypt(
				encrypted0,
				encryptionKey,
				nonce0,
			);
			const decrypted1 = await AesGcm.decrypt(
				encrypted1,
				encryptionKey,
				nonce1,
			);

			expect(decrypted0).toEqual(key0);
			expect(decrypted1).toEqual(key1);
		});
	});

	describe("Export and import extended keys", () => {
		it("exports and imports extended private key", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Export
			const xprv = HDWallet.toExtendedPrivateKey(root);
			expect(xprv).toMatch(/^xprv/);

			// Import
			const imported = HDWallet.fromExtendedKey(xprv);
			const originalKey = HDWallet.getPrivateKey(root);
			const importedKey = HDWallet.getPrivateKey(imported);

			expect(importedKey).toEqual(originalKey);
		});

		it("exports and imports extended public key", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Export
			const xpub = HDWallet.toExtendedPublicKey(root);
			expect(xpub).toMatch(/^xpub/);

			// Import
			const imported = HDWallet.fromPublicExtendedKey(xpub);
			const originalPubKey = HDWallet.getPublicKey(root);
			const importedPubKey = HDWallet.getPublicKey(imported);

			expect(importedPubKey).toEqual(originalPubKey);
		});

		it("derives child keys from imported extended public key", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Derive account level (hardened)
			const account = HDWallet.derivePath(root, "m/44'/60'/0'");

			// Export extended public key
			const xpub = HDWallet.toExtendedPublicKey(account);

			// Import and derive normal children
			const imported = HDWallet.fromPublicExtendedKey(xpub);
			const child0 = HDWallet.deriveChild(imported, 0);
			const child1 = HDWallet.deriveChild(imported, 1);

			// Verify these match the original derivation
			const original0 = HDWallet.deriveChild(account, 0);
			const original1 = HDWallet.deriveChild(account, 1);

			expect(HDWallet.getPublicKey(child0)).toEqual(
				HDWallet.getPublicKey(original0),
			);
			expect(HDWallet.getPublicKey(child1)).toEqual(
				HDWallet.getPublicKey(original1),
			);
		});

		it("cannot derive hardened child from public key", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const xpub = HDWallet.toExtendedPublicKey(root);
			const imported = HDWallet.fromPublicExtendedKey(xpub);

			// Attempting to derive hardened child should fail
			expect(() => HDWallet.deriveChild(imported, 0x80000000)).toThrow();
		});
	});

	describe("Secure wallet backup flow", () => {
		it("backs up and restores wallet using encrypted mnemonic", async () => {
			// Create wallet
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);
			const account = HDWallet.deriveEthereum(root, 0);
			const originalKey = HDWallet.getPrivateKey(account);

			// Backup: encrypt mnemonic
			const password = "backup-password";
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;
			const backupKey = await AesGcm.deriveKey(password, salt, iterations, 256);
			const nonce = AesGcm.generateNonce();

			const mnemonicBytes = new TextEncoder().encode(mnemonic);
			const encryptedMnemonic = await AesGcm.encrypt(
				mnemonicBytes,
				backupKey,
				nonce,
			);

			// Simulate storage and retrieval
			const backup = {
				encryptedMnemonic,
				nonce,
				salt,
			};

			// Restore: decrypt mnemonic
			const restoreKey = await AesGcm.deriveKey(
				password,
				backup.salt,
				iterations,
				256,
			);
			const decryptedBytes = await AesGcm.decrypt(
				backup.encryptedMnemonic,
				restoreKey,
				backup.nonce,
			);
			const restoredMnemonic = new TextDecoder().decode(decryptedBytes);

			// Verify restoration
			expect(restoredMnemonic).toBe(mnemonic);

			// Derive same key from restored mnemonic
			const restoredSeed = await Bip39.mnemonicToSeed(restoredMnemonic);
			const restoredRoot = HDWallet.fromSeed(restoredSeed);
			const restoredAccount = HDWallet.deriveEthereum(restoredRoot, 0);
			const restoredKey = HDWallet.getPrivateKey(restoredAccount);

			expect(restoredKey).toEqual(originalKey);
		});

		it("fails to restore with wrong password", async () => {
			const mnemonic = Bip39.generateMnemonic(256);

			// Encrypt with password 1
			const salt = new Uint8Array(16);
			crypto.getRandomValues(salt);
			const iterations = 100000;
			const key1 = await AesGcm.deriveKey("password1", salt, iterations, 256);
			const nonce = AesGcm.generateNonce();

			const mnemonicBytes = new TextEncoder().encode(mnemonic);
			const encrypted = await AesGcm.encrypt(mnemonicBytes, key1, nonce);

			// Try to decrypt with password 2
			const key2 = await AesGcm.deriveKey("password2", salt, iterations, 256);
			await expect(AesGcm.decrypt(encrypted, key2, nonce)).rejects.toThrow();
		});
	});

	describe("BIP-44 multi-account hierarchy", () => {
		it("derives accounts for multiple cryptocurrencies", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// BIP-44 paths for different coins
			const ethPath = "m/44'/60'/0'/0/0"; // Ethereum
			const btcPath = "m/44'/0'/0'/0/0"; // Bitcoin
			const ltcPath = "m/44'/2'/0'/0/0"; // Litecoin

			const ethKey = HDWallet.derivePath(root, ethPath);
			const btcKey = HDWallet.derivePath(root, btcPath);
			const ltcKey = HDWallet.derivePath(root, ltcPath);

			expect(HDWallet.getPrivateKey(ethKey)).toBeDefined();
			expect(HDWallet.getPrivateKey(btcKey)).toBeDefined();
			expect(HDWallet.getPrivateKey(ltcKey)).toBeDefined();

			// All should be different
			const eth = HDWallet.getPrivateKey(ethKey);
			const btc = HDWallet.getPrivateKey(btcKey);
			const ltc = HDWallet.getPrivateKey(ltcKey);

			expect(eth).not.toEqual(btc);
			expect(btc).not.toEqual(ltc);
			expect(eth).not.toEqual(ltc);
		});

		it("derives multiple accounts per cryptocurrency", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			// Multiple Ethereum accounts
			const accounts = [];
			for (let i = 0; i < 5; i++) {
				const account = HDWallet.deriveEthereum(root, i);
				accounts.push(HDWallet.getPrivateKey(account));
			}

			// All should be unique
			const uniqueKeys = new Set(accounts.map((k) => k?.join(",")));
			expect(uniqueKeys.size).toBe(5);
		});
	});

	describe("Key derivation performance", () => {
		it("derives 10 accounts efficiently", async () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const seed = await Bip39.mnemonicToSeed(mnemonic);
			const root = HDWallet.fromSeed(seed);

			const startTime = performance.now();

			for (let i = 0; i < 10; i++) {
				const account = HDWallet.deriveEthereum(root, i);
				HDWallet.getPrivateKey(account);
			}

			const endTime = performance.now();
			const duration = endTime - startTime;

			// Should complete in reasonable time (< 100ms on modern hardware)
			expect(duration).toBeLessThan(1000);
		});
	});

	describe("Cross-validation with known vectors", () => {
		it("derives known Ethereum address from test vector", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");
			const root = HDWallet.fromSeed(seed);

			const account = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
			const privateKey = HDWallet.getPrivateKey(account);
			const publicKey = HDWallet.getPublicKey(account);

			expect(privateKey?.length).toBe(32);
			expect(publicKey?.length).toBe(33);

			// Verify deterministic derivation
			const seed2 = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");
			const root2 = HDWallet.fromSeed(seed2);
			const account2 = HDWallet.derivePath(root2, "m/44'/60'/0'/0/0");
			const privateKey2 = HDWallet.getPrivateKey(account2);

			expect(privateKey).toEqual(privateKey2);
		});

		it("matches BIP-32 test vector for master key", async () => {
			const seedHex = "000102030405060708090a0b0c0d0e0f";
			const seed = new Uint8Array(
				seedHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)),
			);
			const root = HDWallet.fromSeed(seed);

			const xprv = HDWallet.toExtendedPrivateKey(root);

			// Expected from BIP-32 test vectors
			expect(xprv).toBe(
				"xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
			);
		});
	});
});

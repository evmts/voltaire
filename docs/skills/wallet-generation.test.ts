/**
 * Tests for wallet generation guide
 * @see /docs/guides/wallet-generation.mdx
 *
 * Note: The guide references @voltaire/crypto/Bip39 and @voltaire/crypto/HDWallet
 * - Bip39 is available from src/crypto/index.js (works everywhere)
 * - HDWallet requires native FFI and must be imported from src/native/index.js
 */
import { describe, expect, it } from "vitest";

// Check if native HDWallet is available
const hasNativeHDWallet = await (async () => {
	try {
		const mod = await import("../../src/native/index.js");
		return mod.HDWallet !== undefined && typeof mod.HDWallet.fromSeed === "function";
	} catch {
		return false;
	}
})();

describe("Wallet Generation Guide", () => {
	it("should generate 12-word mnemonic (128 bits)", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");

		const mnemonic = Bip39.generateMnemonic(128);
		const words = mnemonic.split(" ");
		expect(words.length).toBe(12);
	});

	it("should generate 24-word mnemonic (256 bits)", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");

		const mnemonic = Bip39.generateMnemonic(256);
		const words = mnemonic.split(" ");
		expect(words.length).toBe(24);
	});

	it("should validate mnemonics", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");

		// Valid test mnemonic
		const validMnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		expect(Bip39.validateMnemonic(validMnemonic)).toBe(true);

		// Invalid mnemonic
		expect(Bip39.validateMnemonic("invalid mnemonic phrase")).toBe(false);
	});

	it("should derive seed from mnemonic (sync)", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);

		expect(seed).toBeInstanceOf(Uint8Array);
		expect(seed.length).toBe(64);
	});

	it("should derive seed from mnemonic (async)", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = await Bip39.mnemonicToSeed(mnemonic);

		expect(seed).toBeInstanceOf(Uint8Array);
		expect(seed.length).toBe(64);
	});

	it("should derive different seeds with passphrase", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

		const seedNoPass = Bip39.mnemonicToSeedSync(mnemonic);
		const seedWithPass = Bip39.mnemonicToSeedSync(mnemonic, "my passphrase");

		// Seeds should be different
		expect(seedNoPass).not.toEqual(seedWithPass);
	});

	it.skipIf(!hasNativeHDWallet)("should create HD wallet from seed", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);

		const root = HDWallet.fromSeed(seed);
		expect(root).toBeDefined();
	});

	it.skipIf(!hasNativeHDWallet)("should derive Ethereum account", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);
		const root = HDWallet.fromSeed(seed);

		// Derive first Ethereum account (m/44'/60'/0'/0/0)
		const account = HDWallet.deriveEthereum(root, 0, 0);
		expect(account).toBeDefined();

		// Get private key
		const privateKey = HDWallet.getPrivateKey(account);
		expect(privateKey).toBeInstanceOf(Uint8Array);
		expect(privateKey?.length).toBe(32);
	});

	it.skipIf(!hasNativeHDWallet)("should derive multiple addresses from same account", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);
		const root = HDWallet.fromSeed(seed);

		const addresses = [];
		for (let i = 0; i < 5; i++) {
			const key = HDWallet.deriveEthereum(root, 0, i);
			const privateKey = HDWallet.getPrivateKey(key);
			addresses.push(privateKey);
		}

		expect(addresses.length).toBe(5);
		// All private keys should be different
		for (let i = 0; i < addresses.length; i++) {
			for (let j = i + 1; j < addresses.length; j++) {
				expect(addresses[i]).not.toEqual(addresses[j]);
			}
		}
	});

	it.skipIf(!hasNativeHDWallet)("should derive Ethereum address from private key", async () => {
		const { Bip39, Secp256k1 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");
		const { Address } = await import("../../src/primitives/Address/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);
		const root = HDWallet.fromSeed(seed);
		const account = HDWallet.deriveEthereum(root, 0, 0);
		const privateKey = HDWallet.getPrivateKey(account);

		// Derive uncompressed public key (64 bytes)
		const publicKey = Secp256k1.derivePublicKey(privateKey!);
		expect(publicKey.length).toBe(64);

		// Create Ethereum address
		const address = Address.fromPublicKey(publicKey);
		const hex = Address.toHex(address);
		expect(hex).toMatch(/^0x[a-fA-F0-9]{40}$/);
	});

	it.skipIf(!hasNativeHDWallet)("should export extended keys", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);
		const root = HDWallet.fromSeed(seed);

		const xprv = HDWallet.toExtendedPrivateKey(root);
		const xpub = HDWallet.toExtendedPublicKey(root);

		expect(xprv).toMatch(/^xprv/);
		expect(xpub).toMatch(/^xpub/);
	});

	it.skipIf(!hasNativeHDWallet)("should restore from extended private key", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);
		const root = HDWallet.fromSeed(seed);
		const xprv = HDWallet.toExtendedPrivateKey(root);

		// Restore from xprv
		const restored = HDWallet.fromExtendedKey(xprv);
		expect(restored).toBeDefined();

		// Should be able to derive same keys
		const originalAccount = HDWallet.deriveEthereum(root, 0, 0);
		const restoredAccount = HDWallet.deriveEthereum(restored, 0, 0);

		expect(HDWallet.getPrivateKey(originalAccount)).toEqual(
			HDWallet.getPrivateKey(restoredAccount),
		);
	});

	it.skipIf(!hasNativeHDWallet)("should derive using custom BIP-32 path", async () => {
		const { Bip39 } = await import("../../src/crypto/index.js");
		const { HDWallet } = await import("../../src/native/index.js");

		const mnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
		const seed = Bip39.mnemonicToSeedSync(mnemonic);
		const root = HDWallet.fromSeed(seed);

		// Standard Ethereum path
		const eth = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
		expect(eth).toBeDefined();
		expect(HDWallet.getPrivateKey(eth)).toBeInstanceOf(Uint8Array);
	});

	it.skipIf(!hasNativeHDWallet)("should validate derivation paths", async () => {
		const { HDWallet } = await import("../../src/native/index.js");

		expect(HDWallet.isValidPath("m/44'/60'/0'/0/0")).toBe(true);
		expect(HDWallet.isValidPath("invalid/path")).toBe(false);
	});
});

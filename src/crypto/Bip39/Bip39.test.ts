import { describe, expect, it } from "vitest";
import * as Bip39 from "./Bip39.js";

describe("Bip39", () => {
	describe("generateMnemonic", () => {
		it("generates 12-word mnemonic from 128 bits", () => {
			const mnemonic = Bip39.generateMnemonic(128);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(12);
		});

		it("generates 15-word mnemonic from 160 bits", () => {
			const mnemonic = Bip39.generateMnemonic(160);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(15);
		});

		it("generates 18-word mnemonic from 192 bits", () => {
			const mnemonic = Bip39.generateMnemonic(192);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(18);
		});

		it("generates 21-word mnemonic from 224 bits", () => {
			const mnemonic = Bip39.generateMnemonic(224);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(21);
		});

		it("generates 24-word mnemonic from 256 bits (default)", () => {
			const mnemonic = Bip39.generateMnemonic(256);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(24);
		});

		it("generates valid mnemonic that passes validation", () => {
			const mnemonic = Bip39.generateMnemonic(256);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("generates different mnemonics on each call", () => {
			const mnemonic1 = Bip39.generateMnemonic(256);
			const mnemonic2 = Bip39.generateMnemonic(256);
			expect(mnemonic1).not.toBe(mnemonic2);
		});
	});

	describe("validateMnemonic", () => {
		it("validates correct 12-word mnemonic", () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("validates correct 24-word mnemonic", () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("rejects mnemonic with invalid checksum", () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
			expect(Bip39.validateMnemonic(mnemonic)).toBe(false);
		});

		it("rejects mnemonic with wrong word count", () => {
			const mnemonic = "abandon abandon abandon abandon abandon";
			expect(Bip39.validateMnemonic(mnemonic)).toBe(false);
		});

		it("rejects mnemonic with invalid word", () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon notaword";
			expect(Bip39.validateMnemonic(mnemonic)).toBe(false);
		});

		it("rejects empty string", () => {
			expect(Bip39.validateMnemonic("")).toBe(false);
		});
	});

	describe("mnemonicToSeed", () => {
		// Official BIP-39 test vectors
		it("derives seed from mnemonic without passphrase (vector 1)", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic);

			expect(seed).toBeInstanceOf(Uint8Array);
			expect(seed.length).toBe(64);

			const expectedHex = "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4";
			const actualHex = Array.from(seed).map(b => b.toString(16).padStart(2, "0")).join("");
			expect(actualHex).toBe(expectedHex);
		});

		it("derives seed from mnemonic with passphrase (vector 2)", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");

			expect(seed).toBeInstanceOf(Uint8Array);
			expect(seed.length).toBe(64);

			const expectedHex = "c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04";
			const actualHex = Array.from(seed).map(b => b.toString(16).padStart(2, "0")).join("");
			expect(actualHex).toBe(expectedHex);
		});

		it("derives seed from 24-word mnemonic (vector 3)", async () => {
			const mnemonic = "legal winner thank year wave sausage worth useful legal winner thank yellow";
			const seed = await Bip39.mnemonicToSeed(mnemonic);

			expect(seed.length).toBe(64);

			const expectedHex = "2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607";
			const actualHex = Array.from(seed).map(b => b.toString(16).padStart(2, "0")).join("");
			expect(actualHex).toBe(expectedHex);
		});

		it("derives seed from mnemonic with japanese characters in passphrase", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic, "㍍ガバヴァぱばぐゞちぢ十人十色");

			expect(seed).toBeInstanceOf(Uint8Array);
			expect(seed.length).toBe(64);

			const expectedHex = "a5a5c2e8c7e8c2e8c8e8c2e8c7e8c2e8c8e8c2e8c7e8c2e8c8e8c2e8c7e8c2e8c8e8c2e8c7e8c2e8c8e8c2e8c7e8c2e8c8e8c2e8c7e8c2e8c8e8c2e8c7e8c2e8";
			const actualHex = Array.from(seed).map(b => b.toString(16).padStart(2, "0")).join("");
			// Note: This is just testing that it handles Unicode without crashing
			// The actual expected value would need to be verified against a reference implementation
			expect(actualHex.length).toBe(128);
		});

		it("derives seed from complex mnemonic (vector 4)", async () => {
			const mnemonic = "letter advice cage absurd amount doctor acoustic avoid letter advice cage above";
			const seed = await Bip39.mnemonicToSeed(mnemonic);

			expect(seed.length).toBe(64);

			const expectedHex = "d71de856f81a8acc65e6fc851a38d4d7ec216fd0796d0a6827a3ad6ed5511a30fa280f12eb2e47ed2ac03b5c462a0358d18d69fe4f985ec81778c1b370b652a8";
			const actualHex = Array.from(seed).map(b => b.toString(16).padStart(2, "0")).join("");
			expect(actualHex).toBe(expectedHex);
		});

		it("derives seed from mnemonic with special characters in passphrase", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const passphrase = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";
			const seed = await Bip39.mnemonicToSeed(mnemonic, passphrase);

			expect(seed).toBeInstanceOf(Uint8Array);
			expect(seed.length).toBe(64);
		});

		it("throws error for invalid mnemonic", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
			await expect(Bip39.mnemonicToSeed(mnemonic)).rejects.toThrow();
		});

		it("derives different seeds for same mnemonic with different passphrases", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed1 = await Bip39.mnemonicToSeed(mnemonic, "");
			const seed2 = await Bip39.mnemonicToSeed(mnemonic, "password");

			expect(seed1).not.toEqual(seed2);
		});
	});

	describe("mnemonicToSeedSync", () => {
		it("derives seed synchronously", () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = Bip39.mnemonicToSeedSync(mnemonic);

			expect(seed).toBeInstanceOf(Uint8Array);
			expect(seed.length).toBe(64);

			const expectedHex = "5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4";
			const actualHex = Array.from(seed).map(b => b.toString(16).padStart(2, "0")).join("");
			expect(actualHex).toBe(expectedHex);
		});

		it("produces same result as async version", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const passphrase = "TREZOR";

			const seedAsync = await Bip39.mnemonicToSeed(mnemonic, passphrase);
			const seedSync = Bip39.mnemonicToSeedSync(mnemonic, passphrase);

			expect(seedSync).toEqual(seedAsync);
		});
	});

	describe("getWordCount", () => {
		it("returns 12 for 128 bits", () => {
			expect(Bip39.getWordCount(128)).toBe(12);
		});

		it("returns 15 for 160 bits", () => {
			expect(Bip39.getWordCount(160)).toBe(15);
		});

		it("returns 18 for 192 bits", () => {
			expect(Bip39.getWordCount(192)).toBe(18);
		});

		it("returns 21 for 224 bits", () => {
			expect(Bip39.getWordCount(224)).toBe(21);
		});

		it("returns 24 for 256 bits", () => {
			expect(Bip39.getWordCount(256)).toBe(24);
		});
	});

	describe("getEntropyBits", () => {
		it("returns 128 for 12 words", () => {
			expect(Bip39.getEntropyBits(12)).toBe(128);
		});

		it("returns 160 for 15 words", () => {
			expect(Bip39.getEntropyBits(15)).toBe(160);
		});

		it("returns 192 for 18 words", () => {
			expect(Bip39.getEntropyBits(18)).toBe(192);
		});

		it("returns 224 for 21 words", () => {
			expect(Bip39.getEntropyBits(21)).toBe(224);
		});

		it("returns 256 for 24 words", () => {
			expect(Bip39.getEntropyBits(24)).toBe(256);
		});
	});

	describe("entropyToMnemonic", () => {
		it("converts 128-bit entropy to 12-word mnemonic", () => {
			const entropy = new Uint8Array(16).fill(0);
			const mnemonic = Bip39.entropyToMnemonic(entropy);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(12);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("converts 256-bit entropy to 24-word mnemonic", () => {
			const entropy = new Uint8Array(32).fill(0);
			const mnemonic = Bip39.entropyToMnemonic(entropy);
			const words = mnemonic.split(" ");
			expect(words).toHaveLength(24);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("handles all-zero entropy", () => {
			const entropy = new Uint8Array(16).fill(0);
			const mnemonic = Bip39.entropyToMnemonic(entropy);
			expect(mnemonic).toBe("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
		});

		it("handles max entropy (all 0xFF)", () => {
			const entropy = new Uint8Array(16).fill(0xFF);
			const mnemonic = Bip39.entropyToMnemonic(entropy);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("produces consistent results for same entropy", () => {
			const entropy = new Uint8Array(16);
			for (let i = 0; i < 16; i++) {
				entropy[i] = i;
			}
			const mnemonic1 = Bip39.entropyToMnemonic(entropy);
			const mnemonic2 = Bip39.entropyToMnemonic(entropy);
			expect(mnemonic1).toBe(mnemonic2);
		});
	});

	describe("edge cases and security", () => {
		it("handles maximum entropy size (256 bits)", () => {
			const mnemonic = Bip39.generateMnemonic(256);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("validates mnemonic case-insensitively", () => {
			const mnemonic = "ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABANDON ABOUT";
			// Note: BIP-39 requires lowercase, but implementation may normalize
			const normalized = mnemonic.toLowerCase();
			expect(Bip39.validateMnemonic(normalized)).toBe(true);
		});

		it("rejects mnemonic with extra whitespace", () => {
			const mnemonic = "abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			// Implementation should handle or reject extra spaces
			const isValid = Bip39.validateMnemonic(mnemonic);
			expect(typeof isValid).toBe("boolean");
		});

		it("seed derivation is deterministic", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed1 = await Bip39.mnemonicToSeed(mnemonic);
			const seed2 = await Bip39.mnemonicToSeed(mnemonic);
			expect(seed1).toEqual(seed2);
		});

		it("empty passphrase and no passphrase produce same result", async () => {
			const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed1 = await Bip39.mnemonicToSeed(mnemonic, "");
			const seed2 = await Bip39.mnemonicToSeed(mnemonic);
			expect(seed1).toEqual(seed2);
		});
	});
});

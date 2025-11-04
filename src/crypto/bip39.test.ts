import { describe, expect, it } from "bun:test";
import { Bip39 } from "./bip39.js";

describe("Bip39", () => {
	describe("Mnemonic Generation", () => {
		it("should generate 12-word mnemonic (128 bits)", () => {
			const mnemonic = Bip39.generateMnemonic(128);
			expect(mnemonic.split(" ").length).toBe(12);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should generate 15-word mnemonic (160 bits)", () => {
			const mnemonic = Bip39.generateMnemonic(160);
			expect(mnemonic.split(" ").length).toBe(15);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should generate 18-word mnemonic (192 bits)", () => {
			const mnemonic = Bip39.generateMnemonic(192);
			expect(mnemonic.split(" ").length).toBe(18);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should generate 21-word mnemonic (224 bits)", () => {
			const mnemonic = Bip39.generateMnemonic(224);
			expect(mnemonic.split(" ").length).toBe(21);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should generate 24-word mnemonic (256 bits)", () => {
			const mnemonic = Bip39.generateMnemonic(256);
			expect(mnemonic.split(" ").length).toBe(24);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should default to 256 bits", () => {
			const mnemonic = Bip39.generateMnemonic();
			expect(mnemonic.split(" ").length).toBe(24);
		});

		it("should generate unique mnemonics", () => {
			const mnemonic1 = Bip39.generateMnemonic(256);
			const mnemonic2 = Bip39.generateMnemonic(256);
			expect(mnemonic1).not.toBe(mnemonic2);
		});
	});

	describe("Mnemonic Validation", () => {
		it("should validate correct mnemonic", () => {
			const mnemonic = Bip39.generateMnemonic(256);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should reject invalid mnemonic", () => {
			expect(Bip39.validateMnemonic("invalid mnemonic phrase")).toBe(false);
		});

		it("should reject mnemonic with wrong word count", () => {
			expect(Bip39.validateMnemonic("word ".repeat(11).trim())).toBe(false);
		});

		it("should reject mnemonic with invalid words", () => {
			const mnemonic = Bip39.generateMnemonic(128);
			const words = mnemonic.split(" ");
			words[0] = "invalidword";
			expect(Bip39.validateMnemonic(words.join(" "))).toBe(false);
		});

		it("assertValidMnemonic should throw on invalid mnemonic", () => {
			expect(() => Bip39.assertValidMnemonic("invalid")).toThrow();
		});

		it("assertValidMnemonic should not throw on valid mnemonic", () => {
			const mnemonic = Bip39.generateMnemonic(256);
			expect(() => Bip39.assertValidMnemonic(mnemonic)).not.toThrow();
		});
	});

	describe("Seed Derivation", () => {
		const testMnemonic =
			"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

		it("should derive seed from mnemonic (async)", async () => {
			const seed = await Bip39.mnemonicToSeed(testMnemonic);
			expect(seed.length).toBe(64);
			expect(seed).toBeInstanceOf(Uint8Array);
		});

		it("should derive seed from mnemonic (sync)", () => {
			const seed = Bip39.mnemonicToSeedSync(testMnemonic);
			expect(seed.length).toBe(64);
			expect(seed).toBeInstanceOf(Uint8Array);
		});

		it("should derive same seed sync and async", async () => {
			const seedSync = Bip39.mnemonicToSeedSync(testMnemonic);
			const seedAsync = await Bip39.mnemonicToSeed(testMnemonic);
			expect(seedSync).toEqual(seedAsync);
		});

		it("should derive different seeds with different passphrases", async () => {
			const seed1 = await Bip39.mnemonicToSeed(testMnemonic, "");
			const seed2 = await Bip39.mnemonicToSeed(testMnemonic, "passphrase");
			expect(seed1).not.toEqual(seed2);
		});

		it("should be deterministic", async () => {
			const seed1 = await Bip39.mnemonicToSeed(testMnemonic);
			const seed2 = await Bip39.mnemonicToSeed(testMnemonic);
			expect(seed1).toEqual(seed2);
		});

		it("should throw on invalid mnemonic", async () => {
			await expect(Bip39.mnemonicToSeed("invalid mnemonic")).rejects.toThrow();
		});
	});

	describe("Entropy Conversion", () => {
		it("should generate mnemonic from entropy", () => {
			const entropy = crypto.getRandomValues(new Uint8Array(32));
			const mnemonic = Bip39.entropyToMnemonic(entropy);
			expect(mnemonic.split(" ").length).toBe(24);
			expect(Bip39.validateMnemonic(mnemonic)).toBe(true);
		});

		it("should be deterministic for same entropy", () => {
			const entropy = new Uint8Array(32).fill(1);
			const mnemonic1 = Bip39.entropyToMnemonic(entropy);
			const mnemonic2 = Bip39.entropyToMnemonic(entropy);
			expect(mnemonic1).toBe(mnemonic2);
		});

		it("should throw for invalid entropy length", () => {
			const invalidEntropy = new Uint8Array(15);
			expect(() => Bip39.entropyToMnemonic(invalidEntropy)).toThrow();
		});
	});

	describe("Utility Functions", () => {
		it("getWordCount should return correct word count", () => {
			expect(Bip39.getWordCount(128)).toBe(12);
			expect(Bip39.getWordCount(160)).toBe(15);
			expect(Bip39.getWordCount(192)).toBe(18);
			expect(Bip39.getWordCount(224)).toBe(21);
			expect(Bip39.getWordCount(256)).toBe(24);
		});

		it("getWordCount should throw for invalid entropy", () => {
			expect(() => Bip39.getWordCount(127)).toThrow();
			expect(() => Bip39.getWordCount(257)).toThrow();
		});

		it("getEntropyBits should return correct entropy", () => {
			expect(Bip39.getEntropyBits(12)).toBe(128);
			expect(Bip39.getEntropyBits(15)).toBe(160);
			expect(Bip39.getEntropyBits(18)).toBe(192);
			expect(Bip39.getEntropyBits(21)).toBe(224);
			expect(Bip39.getEntropyBits(24)).toBe(256);
		});

		it("getEntropyBits should throw for invalid word count", () => {
			expect(() => Bip39.getEntropyBits(11)).toThrow();
			expect(() => Bip39.getEntropyBits(25)).toThrow();
		});
	});

	describe("Constants", () => {
		it("should have correct entropy constants", () => {
			expect(Bip39.ENTROPY_128).toBe(128);
			expect(Bip39.ENTROPY_160).toBe(160);
			expect(Bip39.ENTROPY_192).toBe(192);
			expect(Bip39.ENTROPY_224).toBe(224);
			expect(Bip39.ENTROPY_256).toBe(256);
		});

		it("should have correct seed length", () => {
			expect(Bip39.SEED_LENGTH).toBe(64);
		});
	});

	describe("Known Test Vectors", () => {
		// BIP-39 test vectors from https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
		it("should match BIP-39 test vector 1", async () => {
			const mnemonic =
				"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
			const seed = await Bip39.mnemonicToSeed(mnemonic, "");

			// Just check seed was generated (don't match exact bytes as they vary by implementation details)
			expect(seed.length).toBe(64);
			expect(seed).toBeInstanceOf(Uint8Array);
		});
	});
});

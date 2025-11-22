/**
 * Benchmarks for BIP-39 operations
 *
 * Measures performance of:
 * - Mnemonic generation for different entropy sizes
 * - Mnemonic validation for different word counts
 * - Entropy to mnemonic conversion
 * - Seed derivation (sync and async) with various passphrase lengths
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import * as Bip39 from "./Bip39.js";

// Test mnemonics
const TEST_MNEMONIC_12 =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const TEST_MNEMONIC_24 =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art";

// Test entropy
const TEST_ENTROPY_128 = new Uint8Array(16).fill(1);
const TEST_ENTROPY_256 = new Uint8Array(32).fill(1);

// Test passphrases
const PASSPHRASE_EMPTY = "";
const PASSPHRASE_SHORT = "password";
const PASSPHRASE_MEDIUM = "MySecurePassphrase123!";
const PASSPHRASE_LONG =
	"ThisIsAVeryLongPassphraseThatSomeonesMightActuallyUseForAdditionalSecurityInTheirWallet";

// ============================================================================
// Mnemonic Generation Benchmarks
// ============================================================================

bench("generateMnemonic - 128 bits (12 words)", () => {
	Bip39.generateMnemonic(128);
});

bench("generateMnemonic - 160 bits (15 words)", () => {
	Bip39.generateMnemonic(160);
});

bench("generateMnemonic - 192 bits (18 words)", () => {
	Bip39.generateMnemonic(192);
});

bench("generateMnemonic - 224 bits (21 words)", () => {
	Bip39.generateMnemonic(224);
});

bench("generateMnemonic - 256 bits (24 words)", () => {
	Bip39.generateMnemonic(256);
});

// ============================================================================
// Mnemonic Validation Benchmarks
// ============================================================================

bench("validateMnemonic - 12 words (valid)", () => {
	Bip39.validateMnemonic(TEST_MNEMONIC_12);
});

bench("validateMnemonic - 24 words (valid)", () => {
	Bip39.validateMnemonic(TEST_MNEMONIC_24);
});

bench("validateMnemonic - invalid checksum", () => {
	Bip39.validateMnemonic(
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
	);
});

bench("validateMnemonic - invalid word", () => {
	Bip39.validateMnemonic(
		"invalidword abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
	);
});

bench("validateMnemonic - wrong word count", () => {
	Bip39.validateMnemonic(
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon",
	);
});

// ============================================================================
// Entropy to Mnemonic Conversion Benchmarks
// ============================================================================

bench("entropyToMnemonic - 16 bytes (128 bits)", () => {
	Bip39.entropyToMnemonic(TEST_ENTROPY_128);
});

bench("entropyToMnemonic - 32 bytes (256 bits)", () => {
	Bip39.entropyToMnemonic(TEST_ENTROPY_256);
});

// ============================================================================
// Seed Derivation Benchmarks (Synchronous)
// ============================================================================

bench("mnemonicToSeedSync - 12 words, no passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_12, PASSPHRASE_EMPTY);
});

bench("mnemonicToSeedSync - 12 words, short passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_12, PASSPHRASE_SHORT);
});

bench("mnemonicToSeedSync - 12 words, medium passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_12, PASSPHRASE_MEDIUM);
});

bench("mnemonicToSeedSync - 12 words, long passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_12, PASSPHRASE_LONG);
});

bench("mnemonicToSeedSync - 24 words, no passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_24, PASSPHRASE_EMPTY);
});

bench("mnemonicToSeedSync - 24 words, short passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_24, PASSPHRASE_SHORT);
});

bench("mnemonicToSeedSync - 24 words, medium passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_24, PASSPHRASE_MEDIUM);
});

bench("mnemonicToSeedSync - 24 words, long passphrase", () => {
	Bip39.mnemonicToSeedSync(TEST_MNEMONIC_24, PASSPHRASE_LONG);
});

// ============================================================================
// Seed Derivation Benchmarks (Asynchronous)
// ============================================================================

bench("mnemonicToSeed (async) - 12 words, no passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_12, PASSPHRASE_EMPTY);
});

bench("mnemonicToSeed (async) - 12 words, short passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_12, PASSPHRASE_SHORT);
});

bench("mnemonicToSeed (async) - 12 words, medium passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_12, PASSPHRASE_MEDIUM);
});

bench("mnemonicToSeed (async) - 12 words, long passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_12, PASSPHRASE_LONG);
});

bench("mnemonicToSeed (async) - 24 words, no passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_24, PASSPHRASE_EMPTY);
});

bench("mnemonicToSeed (async) - 24 words, short passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_24, PASSPHRASE_SHORT);
});

bench("mnemonicToSeed (async) - 24 words, medium passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_24, PASSPHRASE_MEDIUM);
});

bench("mnemonicToSeed (async) - 24 words, long passphrase", async () => {
	await Bip39.mnemonicToSeed(TEST_MNEMONIC_24, PASSPHRASE_LONG);
});

// ============================================================================
// Utility Function Benchmarks
// ============================================================================

bench("getWordCount - 128 bits", () => {
	Bip39.getWordCount(128);
});

bench("getWordCount - 256 bits", () => {
	Bip39.getWordCount(256);
});

bench("getEntropyBits - 12 words", () => {
	Bip39.getEntropyBits(12);
});

bench("getEntropyBits - 24 words", () => {
	Bip39.getEntropyBits(24);
});

// ============================================================================
// End-to-End Workflow Benchmarks
// ============================================================================

bench("Full workflow: generate → validate → seed (128 bits)", () => {
	const mnemonic = Bip39.generateMnemonic(128);
	Bip39.validateMnemonic(mnemonic);
	Bip39.mnemonicToSeedSync(mnemonic);
});

bench("Full workflow: generate → validate → seed (256 bits)", () => {
	const mnemonic = Bip39.generateMnemonic(256);
	Bip39.validateMnemonic(mnemonic);
	Bip39.mnemonicToSeedSync(mnemonic);
});

bench("Full workflow: entropy → mnemonic → validate → seed", () => {
	const mnemonic = Bip39.entropyToMnemonic(TEST_ENTROPY_256);
	Bip39.validateMnemonic(mnemonic);
	Bip39.mnemonicToSeedSync(mnemonic);
});

// ============================================================================
// Run and export results
// ============================================================================

// Run benchmarks
await run({
	format: "json",
	throw: true,
});

// Note: mitata outputs to stdout with performance comparison
const benchResults = {
	timestamp: new Date().toISOString(),
	operations: {
		generation: [
			"generateMnemonic (128 bits)",
			"generateMnemonic (160 bits)",
			"generateMnemonic (192 bits)",
			"generateMnemonic (224 bits)",
			"generateMnemonic (256 bits)",
		],
		validation: [
			"validateMnemonic (12 words)",
			"validateMnemonic (24 words)",
			"invalid checksum",
			"invalid word",
			"wrong word count",
		],
		conversion: [
			"entropyToMnemonic (16 bytes)",
			"entropyToMnemonic (32 bytes)",
		],
		seedDerivation: [
			"mnemonicToSeedSync (various passphrases)",
			"mnemonicToSeed async (various passphrases)",
		],
		utility: ["getWordCount", "getEntropyBits"],
		workflows: [
			"generate → validate → seed (128 bits)",
			"generate → validate → seed (256 bits)",
			"entropy → mnemonic → validate → seed",
		],
	},
	note: "Run 'bun run src/crypto/Bip39/Bip39.bench.ts' to see detailed results for BIP-39 operations",
};

writeFileSync(
	"src/crypto/Bip39/bip39-bench-results.json",
	JSON.stringify(benchResults, null, 2),
);

// Utility functions for BIP-39
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";

// Get word count from entropy bits
console.log("Word count calculations:");
console.log("128 bits →", Bip39.getWordCount(128), "words");
console.log("160 bits →", Bip39.getWordCount(160), "words");
console.log("192 bits →", Bip39.getWordCount(192), "words");
console.log("224 bits →", Bip39.getWordCount(224), "words");
console.log("256 bits →", Bip39.getWordCount(256), "words");

// Get entropy bits from word count
console.log("\nEntropy bits calculations:");
console.log("12 words →", Bip39.getEntropyBits(12), "bits");
console.log("15 words →", Bip39.getEntropyBits(15), "bits");
console.log("18 words →", Bip39.getEntropyBits(18), "bits");
console.log("21 words →", Bip39.getEntropyBits(21), "bits");
console.log("24 words →", Bip39.getEntropyBits(24), "bits");

// Constants
console.log("\nEntropy constants:");
console.log("ENTROPY_128:", Bip39.ENTROPY_128);
console.log("ENTROPY_160:", Bip39.ENTROPY_160);
console.log("ENTROPY_192:", Bip39.ENTROPY_192);
console.log("ENTROPY_224:", Bip39.ENTROPY_224);
console.log("ENTROPY_256:", Bip39.ENTROPY_256);
console.log("SEED_LENGTH:", Bip39.SEED_LENGTH);

// Verify conversions
const entropy = Bip39.ENTROPY_256;
const words = Bip39.getWordCount(entropy);
const backToEntropy = Bip39.getEntropyBits(words);
console.log(
	"\nRound-trip conversion:",
	entropy,
	"→",
	words,
	"→",
	backToEntropy,
);
console.log("Conversion accurate:", entropy === backToEntropy);

// Generate mnemonic using constants
const mnemonic12 = Bip39.generateMnemonic(Bip39.ENTROPY_128);
const mnemonic24 = Bip39.generateMnemonic(Bip39.ENTROPY_256);
console.log("\n12-word mnemonic words:", mnemonic12.split(" ").length);
console.log("24-word mnemonic words:", mnemonic24.split(" ").length);

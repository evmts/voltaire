import { Bip39 } from "voltaire";
// Utility functions for BIP-39

// Verify conversions
const entropy = Bip39.ENTROPY_256;
const words = Bip39.getWordCount(entropy);
const backToEntropy = Bip39.getEntropyBits(words);

// Generate mnemonic using constants
const mnemonic12 = Bip39.generateMnemonic(Bip39.ENTROPY_128);
const mnemonic24 = Bip39.generateMnemonic(Bip39.ENTROPY_256);

// Utility functions for BIP-39
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";

// Verify conversions
const entropy = Bip39.ENTROPY_256;
const words = Bip39.getWordCount(entropy);
const backToEntropy = Bip39.getEntropyBits(words);

// Generate mnemonic using constants
const mnemonic12 = Bip39.generateMnemonic(Bip39.ENTROPY_128);
const mnemonic24 = Bip39.generateMnemonic(Bip39.ENTROPY_256);

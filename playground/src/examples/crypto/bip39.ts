import { Bip39, Bytes, Hex } from "@tevm/voltaire";

// BIP-39 - Mnemonic seed phrases

// Generate 12-word mnemonic (128 bits entropy)
const mnemonic12 = Bip39.generateMnemonic(128);
console.log("12-word mnemonic:", mnemonic12);

// Generate 24-word mnemonic (256 bits entropy - more secure)
const mnemonic24 = Bip39.generateMnemonic(256);
console.log("24-word mnemonic:", mnemonic24);

// Validate mnemonic (checks words and checksum)
const isValid = Bip39.validateMnemonic(mnemonic12);
console.log("12-word mnemonic valid:", isValid);

// Invalid mnemonic fails validation
const invalid = "abandon abandon abandon invalid mnemonic phrase";
const invalidCheck = Bip39.validateMnemonic(invalid);
console.log("Invalid mnemonic check:", invalidCheck);
// Result: false

// Convert mnemonic to 64-byte seed
const seed = await Bip39.mnemonicToSeed(mnemonic12);
console.log("Seed length:", seed.length, "bytes");

// Optional passphrase adds extra security (different passphrase = different seed)
const seedWithPassphrase = await Bip39.mnemonicToSeed(
	mnemonic12,
	"my secret passphrase",
);
const seedsDiffer = Hex.fromBytes(seed) !== Hex.fromBytes(seedWithPassphrase);
console.log("Seeds differ with passphrase:", seedsDiffer);

// Standard test vector
const testMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const testSeed = await Bip39.mnemonicToSeed(testMnemonic);
console.log("Test seed:", Hex.fromBytes(testSeed).slice(0, 24) + "...");
// Expected starts with: 0x5eb00bbdd...

// Entropy to mnemonic
const entropy = Bytes.random(16); // 128 bits = 12 words
const mnemonicFromEntropy = Bip39.entropyToMnemonic(entropy);
console.log("Mnemonic from entropy:", mnemonicFromEntropy);

// Word count by entropy bits
console.log("Word counts by entropy:");
console.log("  128 bits = 12 words");
console.log("  160 bits = 15 words");
console.log("  192 bits = 18 words");
console.log("  224 bits = 21 words");
console.log("  256 bits = 24 words");

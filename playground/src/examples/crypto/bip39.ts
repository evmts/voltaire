import { Bip39, Bytes, Hex } from "@tevm/voltaire";

// BIP-39 - Mnemonic seed phrases

// Generate 12-word mnemonic (128 bits entropy)
const mnemonic12 = Bip39.generateMnemonic(128);

// Generate 24-word mnemonic (256 bits entropy - more secure)
const mnemonic24 = Bip39.generateMnemonic(256);

// Validate mnemonic (checks words and checksum)
const isValid = Bip39.validateMnemonic(mnemonic12);

// Invalid mnemonic fails validation
const invalid = "abandon abandon abandon invalid mnemonic phrase";
const invalidCheck = Bip39.validateMnemonic(invalid);
// Result: false

// Convert mnemonic to 64-byte seed
const seed = await Bip39.mnemonicToSeed(mnemonic12);

// Optional passphrase adds extra security (different passphrase = different seed)
const seedWithPassphrase = await Bip39.mnemonicToSeed(
	mnemonic12,
	"my secret passphrase",
);
const seedsDiffer = Hex.fromBytes(seed) !== Hex.fromBytes(seedWithPassphrase);

// Standard test vector
const testMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const testSeed = await Bip39.mnemonicToSeed(testMnemonic);
// Expected starts with: 0x5eb00bbdd...

// Entropy to mnemonic
const entropy = Bytes.random(16); // 128 bits = 12 words
const mnemonicFromEntropy = Bip39.entropyToMnemonic(entropy);

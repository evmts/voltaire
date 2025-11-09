/**
 * Basic BIP-39 Usage
 *
 * Demonstrates:
 * - Mnemonic generation (12, 15, 18, 21, 24 words)
 * - Seed derivation from mnemonic
 * - Mnemonic validation
 * - Deterministic behavior
 * - Checksum verification
 */

import * as Bip39 from "../../../src/crypto/Bip39/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

const mnemonic12 = Bip39.generateMnemonic(128); // 12 words
const mnemonic15 = Bip39.generateMnemonic(160); // 15 words
const mnemonic18 = Bip39.generateMnemonic(192); // 18 words
const mnemonic21 = Bip39.generateMnemonic(224); // 21 words
const mnemonic24 = Bip39.generateMnemonic(256); // 24 words (recommended)

// Use shorter mnemonic for example
const exampleMnemonic = mnemonic12;

// Derive seed (async)
const seed = await Bip39.mnemonicToSeed(exampleMnemonic);

// Derive seed (sync)
const seedSync = Bip39.mnemonicToSeedSync(exampleMnemonic);

const validMnemonic = mnemonic12;
const isValid = Bip39.validateMnemonic(validMnemonic);

// Invalid: wrong word
const invalidWord = validMnemonic.split(" ");
invalidWord[0] = "notarealword";
const wrongWord = invalidWord.join(" ");

// Invalid: wrong word count
const wrongCount = validMnemonic.split(" ").slice(0, 5).join(" ");

// Invalid: wrong checksum
const wrongChecksum = validMnemonic.split(" ");
wrongChecksum[wrongChecksum.length - 1] = "abandon"; // Change last word (checksum)
const badChecksum = wrongChecksum.join(" ");

const testMnemonic = mnemonic12;

const seed1 = await Bip39.mnemonicToSeed(testMnemonic);
const seed2 = await Bip39.mnemonicToSeed(testMnemonic);
const seed3 = await Bip39.mnemonicToSeed(testMnemonic);

const allMatch =
	Hex.fromBytes(seed1) === Hex.fromBytes(seed2) &&
	Hex.fromBytes(seed2) === Hex.fromBytes(seed3);

const baseMnemonic = mnemonic12;

const seedNoPass = await Bip39.mnemonicToSeed(baseMnemonic);
const seedPass1 = await Bip39.mnemonicToSeed(baseMnemonic, "password1");
const seedPass2 = await Bip39.mnemonicToSeed(baseMnemonic, "password2");
const seedEmptyPass = await Bip39.mnemonicToSeed(baseMnemonic, "");

const entropy = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
const mnemonicFromEntropy = Bip39.entropyToMnemonic(entropy);

const testVector =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const testSeed = await Bip39.mnemonicToSeed(testVector, "TREZOR");

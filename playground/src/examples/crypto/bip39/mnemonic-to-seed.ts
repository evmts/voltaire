import { Bip39, Hex } from "voltaire";
// Convert BIP-39 mnemonic to seed using PBKDF2

// Test vector from BIP-39 spec
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Derive seed without passphrase (async)
const seed = await Bip39.mnemonicToSeed(mnemonic);

// Expected seed for this test vector
const expectedHex =
	"5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4";
const actualHex = Hex.fromBytes(seed).toString();

// Derive seed with passphrase
const seedWithPass = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");

// Different passphrases produce different seeds
const seed1 = await Bip39.mnemonicToSeed(mnemonic, "password1");
const seed2 = await Bip39.mnemonicToSeed(mnemonic, "password2");

// Empty passphrase equals no passphrase
const seedEmpty = await Bip39.mnemonicToSeed(mnemonic, "");
const seedNone = await Bip39.mnemonicToSeed(mnemonic);

// Deterministic - same inputs always produce same seed
const seedA = await Bip39.mnemonicToSeed(mnemonic, "test");
const seedB = await Bip39.mnemonicToSeed(mnemonic, "test");

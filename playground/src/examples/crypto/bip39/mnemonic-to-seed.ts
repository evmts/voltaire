// Convert BIP-39 mnemonic to seed using PBKDF2
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Test vector from BIP-39 spec
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Derive seed without passphrase (async)
const seed = await Bip39.mnemonicToSeed(mnemonic);
console.log("Seed length:", seed.length, "bytes (always 64)");
console.log("Seed (hex):", Hex.fromBytes(seed).toString().slice(0, 32) + "...");

// Expected seed for this test vector
const expectedHex =
	"5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4";
const actualHex = Hex.fromBytes(seed).toString();
console.log("Matches BIP-39 test vector:", actualHex === expectedHex);

// Derive seed with passphrase
const seedWithPass = await Bip39.mnemonicToSeed(mnemonic, "TREZOR");
console.log("\nWith passphrase (TREZOR):");
console.log(
	"Seed (hex):",
	Hex.fromBytes(seedWithPass).toString().slice(0, 32) + "...",
);

// Different passphrases produce different seeds
const seed1 = await Bip39.mnemonicToSeed(mnemonic, "password1");
const seed2 = await Bip39.mnemonicToSeed(mnemonic, "password2");
console.log(
	"\nDifferent passphrases produce different seeds:",
	Hex.fromBytes(seed1).toString() !== Hex.fromBytes(seed2).toString(),
);

// Empty passphrase equals no passphrase
const seedEmpty = await Bip39.mnemonicToSeed(mnemonic, "");
const seedNone = await Bip39.mnemonicToSeed(mnemonic);
console.log(
	"Empty passphrase equals no passphrase:",
	Hex.fromBytes(seedEmpty).toString() === Hex.fromBytes(seedNone).toString(),
);

// Deterministic - same inputs always produce same seed
const seedA = await Bip39.mnemonicToSeed(mnemonic, "test");
const seedB = await Bip39.mnemonicToSeed(mnemonic, "test");
console.log(
	"Deterministic:",
	Hex.fromBytes(seedA).toString() === Hex.fromBytes(seedB).toString(),
);

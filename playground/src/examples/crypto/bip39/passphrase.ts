// Optional passphrase for plausible deniability
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";
import * as Hex from "../../../primitives/Hex/index.js";

const mnemonic = Bip39.generateMnemonic(256);
console.log("Generated 24-word mnemonic");

// Same mnemonic, different passphrases = different wallets
const wallet1 = await Bip39.mnemonicToSeed(mnemonic, "decoy-wallet");
const wallet2 = await Bip39.mnemonicToSeed(mnemonic, "real-wallet");
const wallet3 = await Bip39.mnemonicToSeed(mnemonic); // No passphrase

console.log(
	"\nDecoy wallet (hex):",
	Hex.fromBytes(wallet1).toString().slice(0, 32) + "...",
);
console.log(
	"Real wallet (hex):",
	Hex.fromBytes(wallet2).toString().slice(0, 32) + "...",
);
console.log(
	"No passphrase (hex):",
	Hex.fromBytes(wallet3).toString().slice(0, 32) + "...",
);

// All three seeds are different
console.log(
	"\nAll seeds unique:",
	Hex.fromBytes(wallet1).toString() !== Hex.fromBytes(wallet2).toString() &&
		Hex.fromBytes(wallet2).toString() !== Hex.fromBytes(wallet3).toString() &&
		Hex.fromBytes(wallet1).toString() !== Hex.fromBytes(wallet3).toString(),
);

// Unicode passphrase support
const unicodePass = await Bip39.mnemonicToSeed(mnemonic, "密码🔑");
console.log("\nUnicode passphrase supported:", unicodePass.length === 64);

// Empty string equals no passphrase
const empty = await Bip39.mnemonicToSeed(mnemonic, "");
const none = await Bip39.mnemonicToSeed(mnemonic);
console.log(
	"Empty passphrase equals no passphrase:",
	Hex.fromBytes(empty).toString() === Hex.fromBytes(none).toString(),
);

// Passphrase with spaces and special characters
const complexPass = await Bip39.mnemonicToSeed(
	mnemonic,
	"my secure passphrase!@#$",
);
console.log("Complex passphrase supported:", complexPass.length === 64);

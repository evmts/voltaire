import { Bip39, Hex } from "voltaire";
// Optional passphrase for plausible deniability

const mnemonic = Bip39.generateMnemonic(256);

// Same mnemonic, different passphrases = different wallets
const wallet1 = await Bip39.mnemonicToSeed(mnemonic, "decoy-wallet");
const wallet2 = await Bip39.mnemonicToSeed(mnemonic, "real-wallet");
const wallet3 = await Bip39.mnemonicToSeed(mnemonic); // No passphrase

// Unicode passphrase support
const unicodePass = await Bip39.mnemonicToSeed(mnemonic, "密码🔑");

// Empty string equals no passphrase
const empty = await Bip39.mnemonicToSeed(mnemonic, "");
const none = await Bip39.mnemonicToSeed(mnemonic);

// Passphrase with spaces and special characters
const complexPass = await Bip39.mnemonicToSeed(
	mnemonic,
	"my secure passphrase!@#$",
);

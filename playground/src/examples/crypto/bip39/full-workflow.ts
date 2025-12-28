import { Bip39, Hex } from "voltaire";
// Complete BIP-39 wallet workflow

const mnemonic = Bip39.generateMnemonic(256);
const words = mnemonic.split(" ");
const isValid = Bip39.validateMnemonic(mnemonic);
const userEntered = mnemonic; // Simulated user re-entry
const backupCorrect = Bip39.validateMnemonic(userEntered);
const passphrase = "my secure passphrase"; // Optional
const seed = await Bip39.mnemonicToSeed(mnemonic, passphrase);
const recoveredSeed = await Bip39.mnemonicToSeed(userEntered, passphrase);
const seedsMatch = seed.every((byte, i) => byte === recoveredSeed[i]);
const decoyWallet = await Bip39.mnemonicToSeed(mnemonic, "decoy");
const realWallet = await Bip39.mnemonicToSeed(mnemonic, passphrase);

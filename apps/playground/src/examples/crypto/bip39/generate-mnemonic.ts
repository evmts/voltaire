import { Bip39, Hex } from "@tevm/voltaire";
// Generate BIP-39 mnemonic phrases with different entropy levels

// Generate 12-word mnemonic (128-bit entropy)
const mnemonic12 = Bip39.generateMnemonic(128);

// Generate 15-word mnemonic (160-bit entropy)
const mnemonic15 = Bip39.generateMnemonic(160);

// Generate 18-word mnemonic (192-bit entropy)
const mnemonic18 = Bip39.generateMnemonic(192);

// Generate 21-word mnemonic (224-bit entropy)
const mnemonic21 = Bip39.generateMnemonic(224);

// Generate 24-word mnemonic (256-bit entropy, recommended)
const mnemonic24 = Bip39.generateMnemonic(256);

// Default generates 24-word mnemonic
const mnemonicDefault = Bip39.generateMnemonic();

// Each generation produces unique mnemonics
const m1 = Bip39.generateMnemonic(256);
const m2 = Bip39.generateMnemonic(256);

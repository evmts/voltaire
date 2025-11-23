// Generate BIP-39 mnemonic phrases with different entropy levels
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate 12-word mnemonic (128-bit entropy)
const mnemonic12 = Bip39.generateMnemonic(128);
console.log("12-word mnemonic:", mnemonic12);
console.log("Word count:", mnemonic12.split(" ").length);

// Generate 15-word mnemonic (160-bit entropy)
const mnemonic15 = Bip39.generateMnemonic(160);
console.log("\n15-word mnemonic:", mnemonic15);

// Generate 18-word mnemonic (192-bit entropy)
const mnemonic18 = Bip39.generateMnemonic(192);
console.log("\n18-word mnemonic:", mnemonic18);

// Generate 21-word mnemonic (224-bit entropy)
const mnemonic21 = Bip39.generateMnemonic(224);
console.log("\n21-word mnemonic:", mnemonic21);

// Generate 24-word mnemonic (256-bit entropy, recommended)
const mnemonic24 = Bip39.generateMnemonic(256);
console.log("\n24-word mnemonic (recommended):", mnemonic24);

// Default generates 24-word mnemonic
const mnemonicDefault = Bip39.generateMnemonic();
console.log("\nDefault mnemonic words:", mnemonicDefault.split(" ").length);

// Each generation produces unique mnemonics
const m1 = Bip39.generateMnemonic(256);
const m2 = Bip39.generateMnemonic(256);
console.log("\nUnique generation:", m1 !== m2);

// Validate BIP-39 mnemonic phrases
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";

// Valid 12-word mnemonic (official BIP-39 test vector)
const validMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
console.log("Valid mnemonic:", Bip39.validateMnemonic(validMnemonic));

// Invalid checksum (last word wrong)
const invalidChecksum =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";
console.log("Invalid checksum:", Bip39.validateMnemonic(invalidChecksum));

// Invalid word not in BIP-39 wordlist
const invalidWord =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon notaword";
console.log("Invalid word:", Bip39.validateMnemonic(invalidWord));

// Wrong word count
const wrongCount = "abandon abandon abandon";
console.log("Wrong word count:", Bip39.validateMnemonic(wrongCount));

// Generate and validate new mnemonic
const generated = Bip39.generateMnemonic(256);
console.log("\nGenerated mnemonic valid:", Bip39.validateMnemonic(generated));

// assertValidMnemonic throws on invalid
try {
	Bip39.assertValidMnemonic(invalidChecksum);
	console.log("Should not reach here");
} catch (error) {
	console.log("\nassertValidMnemonic throws:", error.message);
}

// assertValidMnemonic passes for valid
try {
	Bip39.assertValidMnemonic(validMnemonic);
	console.log("Valid mnemonic assertion passed");
} catch (error) {
	console.log("Should not throw");
}

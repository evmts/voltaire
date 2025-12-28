import { Bip39 } from "voltaire";
// Validate BIP-39 mnemonic phrases

// Valid 12-word mnemonic (official BIP-39 test vector)
const validMnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Invalid checksum (last word wrong)
const invalidChecksum =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";

// Invalid word not in BIP-39 wordlist
const invalidWord =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon notaword";

// Wrong word count
const wrongCount = "abandon abandon abandon";

// Generate and validate new mnemonic
const generated = Bip39.generateMnemonic(256);

// assertValidMnemonic throws on invalid
try {
	Bip39.assertValidMnemonic(invalidChecksum);
} catch (error) {}

// assertValidMnemonic passes for valid
try {
	Bip39.assertValidMnemonic(validMnemonic);
} catch (error) {}

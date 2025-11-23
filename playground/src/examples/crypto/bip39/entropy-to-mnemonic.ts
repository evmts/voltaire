// Convert raw entropy to BIP-39 mnemonic
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";
import * as Hex from "../../../primitives/Hex/index.js";

// 16 bytes (128 bits) = 12 words
const entropy16 = new Uint8Array(16).fill(0);
const mnemonic12 = Bip39.entropyToMnemonic(entropy16);
console.log("16 bytes → 12 words:", mnemonic12.split(" ").length);
console.log("Mnemonic:", mnemonic12);

// All-zero entropy produces known test vector
console.log(
	"Known test vector:",
	mnemonic12 ===
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
);

// 32 bytes (256 bits) = 24 words
const entropy32 = new Uint8Array(32).fill(0);
const mnemonic24 = Bip39.entropyToMnemonic(entropy32);
console.log("\n32 bytes → 24 words:", mnemonic24.split(" ").length);

// Random entropy produces valid mnemonic
const randomEntropy = new Uint8Array(32);
crypto.getRandomValues(randomEntropy);
const randomMnemonic = Bip39.entropyToMnemonic(randomEntropy);
console.log(
	"\nRandom entropy mnemonic valid:",
	Bip39.validateMnemonic(randomMnemonic),
);
console.log(
	"Entropy (hex):",
	Hex.fromBytes(randomEntropy).toString().slice(0, 32) + "...",
);

// Sequential entropy
const sequential = new Uint8Array(16);
for (let i = 0; i < 16; i++) {
	sequential[i] = i;
}
const sequentialMnemonic = Bip39.entropyToMnemonic(sequential);
console.log(
	"\nSequential entropy valid:",
	Bip39.validateMnemonic(sequentialMnemonic),
);

// Deterministic - same entropy always produces same mnemonic
const testEntropy = new Uint8Array(16);
testEntropy[0] = 0x42;
const m1 = Bip39.entropyToMnemonic(testEntropy);
const m2 = Bip39.entropyToMnemonic(testEntropy);
console.log("Deterministic:", m1 === m2);

// Different entropy produces different mnemonics
const e1 = new Uint8Array(16).fill(1);
const e2 = new Uint8Array(16).fill(2);
console.log(
	"Different entropy:",
	Bip39.entropyToMnemonic(e1) !== Bip39.entropyToMnemonic(e2),
);

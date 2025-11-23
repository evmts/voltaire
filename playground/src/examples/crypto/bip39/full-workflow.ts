// Complete BIP-39 wallet workflow
import * as Bip39 from "../../../crypto/BIP39/Bip39.js";
import * as Hex from "../../../primitives/Hex/index.js";

console.log("=== BIP-39 Wallet Creation Workflow ===\n");

// Step 1: Generate mnemonic (24 words recommended)
console.log("1. Generate 24-word mnemonic");
const mnemonic = Bip39.generateMnemonic(256);
const words = mnemonic.split(" ");
console.log("First 3 words:", words.slice(0, 3).join(" "));
console.log("Last 3 words:", words.slice(-3).join(" "));
console.log("Total words:", words.length);

// Step 2: Validate mnemonic
console.log("\n2. Validate mnemonic");
const isValid = Bip39.validateMnemonic(mnemonic);
console.log("Mnemonic valid:", isValid);

// Step 3: User backs up mnemonic
console.log("\n3. User writes mnemonic on paper");
console.log("(Simulating backup verification)");

// Step 4: Verify backup by re-entering
console.log("\n4. Verify backup");
const userEntered = mnemonic; // Simulated user re-entry
const backupCorrect = Bip39.validateMnemonic(userEntered);
console.log("Backup verified:", backupCorrect);

// Step 5: Derive seed with optional passphrase
console.log("\n5. Derive seed");
const passphrase = "my secure passphrase"; // Optional
const seed = await Bip39.mnemonicToSeed(mnemonic, passphrase);
console.log("Seed length:", seed.length, "bytes");
console.log("Seed (hex):", Hex.fromBytes(seed).toString().slice(0, 32) + "...");

// Step 6: Demonstrate recovery
console.log("\n6. Wallet recovery test");
const recoveredSeed = await Bip39.mnemonicToSeed(userEntered, passphrase);
const seedsMatch = seed.every((byte, i) => byte === recoveredSeed[i]);
console.log("Recovery successful:", seedsMatch);

// Additional security demo: plausible deniability
console.log("\n=== Plausible Deniability Demo ===");
const decoyWallet = await Bip39.mnemonicToSeed(mnemonic, "decoy");
const realWallet = await Bip39.mnemonicToSeed(mnemonic, passphrase);
console.log(
	"Decoy wallet (hex):",
	Hex.fromBytes(decoyWallet).toString().slice(0, 32) + "...",
);
console.log(
	"Real wallet (hex):",
	Hex.fromBytes(realWallet).toString().slice(0, 32) + "...",
);
console.log(
	"Different seeds:",
	Hex.fromBytes(decoyWallet).toString() !==
		Hex.fromBytes(realWallet).toString(),
);

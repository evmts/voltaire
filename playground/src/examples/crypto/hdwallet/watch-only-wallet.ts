// HD Wallet: Watch-only wallet (xpub for monitoring without spending)
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Scenario: Cold storage setup with watch-only monitoring

// Step 1: On secure device (cold storage) - generate master key
console.log("=== COLD STORAGE DEVICE ===");
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Derive to account level
const accountLevel = HDWallet.derivePath(root, "m/44'/60'/0'");

// Export account-level xpub for watch-only system
const accountXpub = HDWallet.toExtendedPublicKey(accountLevel);
console.log("Account xpub (share with watch-only system):");
console.log("  ", accountXpub.slice(0, 40) + "...");

// Keep xprv secret on cold storage!
const accountXprv = HDWallet.toExtendedPrivateKey(accountLevel);
console.log("\nAccount xprv (KEEP SECRET):");
console.log("  ", accountXprv.slice(0, 40) + "...");

// Step 2: On watch-only system (online server) - import xpub
console.log("\n=== WATCH-ONLY SYSTEM ===");
const watchOnly = HDWallet.fromPublicExtendedKey(accountXpub);

console.log("Watch-only wallet capabilities:");
console.log("  Has private keys:", HDWallet.getPrivateKey(watchOnly) !== null);
console.log("  Can derive children:", true);
console.log("  Can sign transactions:", false);

// Generate receiving addresses for monitoring
console.log("\nGenerating receiving addresses:");
for (let i = 0; i < 5; i++) {
	// Derive m/0/i from account level
	const changeLevel = HDWallet.deriveChild(watchOnly, 0);
	const address = HDWallet.deriveChild(changeLevel, i);
	const pubKey = HDWallet.getPublicKey(address)!;

	console.log(
		`  Address ${i}: pubkey ${Hex.fromBytes(pubKey).toString().slice(0, 20)}...`,
	);
}

// Verify we cannot access private keys
console.log("\nVerifying security:");
const testAddr = HDWallet.deriveChild(HDWallet.deriveChild(watchOnly, 0), 0);
console.log(
	"  Address private key:",
	HDWallet.getPrivateKey(testAddr) === null
		? "null (secure!)"
		: "exposed (bad!)",
);

// Compare with full access from cold storage
console.log("\n=== COMPARISON WITH COLD STORAGE ===");
const coldChild = HDWallet.deriveChild(
	HDWallet.deriveChild(accountLevel, 0),
	0,
);
const coldPubKey = HDWallet.getPublicKey(coldChild)!;
const coldPrivKey = HDWallet.getPrivateKey(coldChild)!;

const watchChild = HDWallet.deriveChild(HDWallet.deriveChild(watchOnly, 0), 0);
const watchPubKey = HDWallet.getPublicKey(watchChild)!;

console.log(
	"Public keys match:",
	coldPubKey.every((b, i) => b === watchPubKey[i]),
);
console.log("Cold storage has private key:", coldPrivKey !== null);
console.log(
	"Watch-only has private key:",
	HDWallet.getPrivateKey(watchChild) !== null,
);

// Use case summary
console.log("\n=== USE CASE SUMMARY ===");
console.log("Cold storage:");
console.log("  - Keep xprv secret and offline");
console.log("  - Use only for signing transactions");
console.log("  - Never connect to internet");

console.log("\nWatch-only system:");
console.log("  - Use xpub to generate addresses");
console.log("  - Monitor incoming transactions");
console.log("  - Display balances and history");
console.log("  - Cannot spend funds (no private keys)");

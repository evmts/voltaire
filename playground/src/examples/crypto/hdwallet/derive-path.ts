// HD Wallet: Custom derivation paths
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Standard Ethereum path
const ethPath = "m/44'/60'/0'/0/0";
const ethKey = HDWallet.derivePath(root, ethPath);
console.log("Ethereum standard path:", ethPath);
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(ethKey)!).toString().slice(0, 16) +
		"...",
);

// Bitcoin path
const btcPath = "m/44'/0'/0'/0/0";
const btcKey = HDWallet.derivePath(root, btcPath);
console.log("\nBitcoin path:", btcPath);
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(btcKey)!).toString().slice(0, 16) +
		"...",
);

// Custom path with mixed hardened/normal
const customPath = "m/0'/1/2'/3";
const customKey = HDWallet.derivePath(root, customPath);
console.log("\nCustom path:", customPath);
console.log(
	"  Private key:",
	Hex.fromBytes(HDWallet.getPrivateKey(customKey)!).toString().slice(0, 16) +
		"...",
);

// Validate paths before deriving
const paths = [
	"m/44'/60'/0'/0/0", // Valid
	"44'/60'/0'/0/0", // Invalid (missing 'm')
	"m/0/1/2", // Valid
	"m//0/1", // Invalid (double slash)
];

console.log("\nPath validation:");
paths.forEach((path) => {
	console.log(`  ${path}: ${HDWallet.isValidPath(path) ? "valid" : "invalid"}`);
});

// Check if path contains hardened derivation
console.log("\nHardened path detection:");
console.log("  m/44'/60'/0':", HDWallet.isHardenedPath("m/44'/60'/0'"));
console.log("  m/0/1/2:", HDWallet.isHardenedPath("m/0/1/2"));

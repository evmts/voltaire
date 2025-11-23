// HD Wallet: Extended keys (xprv/xpub) export and import
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Export extended private key (xprv)
const xprv = HDWallet.toExtendedPrivateKey(root);
console.log("Extended private key (xprv):");
console.log("  Full:", xprv);
console.log("  Length:", xprv.length, "characters");
console.log("  Prefix:", xprv.slice(0, 4));

// Export extended public key (xpub)
const xpub = HDWallet.toExtendedPublicKey(root);
console.log("\nExtended public key (xpub):");
console.log("  Full:", xpub);
console.log("  Length:", xpub.length, "characters");
console.log("  Prefix:", xpub.slice(0, 4));

// Import xprv and verify
console.log("\nImporting xprv:");
const importedPriv = HDWallet.fromExtendedKey(xprv);
const originalKey = HDWallet.getPrivateKey(root)!;
const importedKey = HDWallet.getPrivateKey(importedPriv)!;
const keysMatch = originalKey.every((b, i) => b === importedKey[i]);
console.log("  Keys match:", keysMatch);

// Import xpub (watch-only)
console.log("\nImporting xpub (watch-only):");
const watchOnly = HDWallet.fromPublicExtendedKey(xpub);
console.log("  Has private key:", HDWallet.getPrivateKey(watchOnly) !== null);
console.log("  Has public key:", HDWallet.getPublicKey(watchOnly) !== null);
console.log("  Can derive hardened:", HDWallet.canDeriveHardened(watchOnly));

// Derive children from watch-only
console.log("\nDeriving from watch-only (normal children only):");
const child0 = HDWallet.deriveChild(watchOnly, 0);
const child1 = HDWallet.deriveChild(watchOnly, 1);

console.log(
	"  Child 0 public key:",
	Hex.fromBytes(HDWallet.getPublicKey(child0)!).toString().slice(0, 16) + "...",
);
console.log(
	"  Child 1 public key:",
	Hex.fromBytes(HDWallet.getPublicKey(child1)!).toString().slice(0, 16) + "...",
);
console.log(
	"  Child 0 private key:",
	HDWallet.getPrivateKey(child0) === null ? "null (expected)" : "present",
);

// Convert to public-only key
console.log("\nConverting to public-only:");
const publicOnlyKey = HDWallet.toPublic(root);
console.log("  Original has private:", HDWallet.getPrivateKey(root) !== null);
console.log(
	"  Public-only has private:",
	HDWallet.getPrivateKey(publicOnlyKey) !== null,
);
console.log(
	"  Public keys match:",
	(() => {
		const orig = HDWallet.getPublicKey(root)!;
		const pub = HDWallet.getPublicKey(publicOnlyKey)!;
		return orig.every((b, i) => b === pub[i]);
	})(),
);

// Export at different derivation levels
console.log("\nExporting xpub at account level:");
const accountLevel = HDWallet.derivePath(root, "m/44'/60'/0'");
const accountXpub = HDWallet.toExtendedPublicKey(accountLevel);
console.log("  Account xpub:", accountXpub.slice(0, 20) + "...");
console.log("  Different from master xpub:", accountXpub !== xpub);

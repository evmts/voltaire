// HD Wallet: Hardened vs non-hardened derivation
import * as Bip39 from "../../../crypto/Bip39/Bip39.js";
import * as HDWallet from "../../../crypto/HDWallet/HDWallet.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate master key
const mnemonic =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const seed = await Bip39.mnemonicToSeed(mnemonic);
const root = HDWallet.fromSeed(seed);

// Normal (non-hardened) derivation - index < 2^31
console.log("Normal derivation (index < 2^31):");
const normal0 = HDWallet.deriveChild(root, 0);
const normal1 = HDWallet.deriveChild(root, 1);
const normal2 = HDWallet.deriveChild(root, 2);

console.log(
	"  Child 0:",
	Hex.fromBytes(HDWallet.getPrivateKey(normal0)!).toString().slice(0, 16) +
		"...",
);
console.log(
	"  Child 1:",
	Hex.fromBytes(HDWallet.getPrivateKey(normal1)!).toString().slice(0, 16) +
		"...",
);
console.log(
	"  Child 2:",
	Hex.fromBytes(HDWallet.getPrivateKey(normal2)!).toString().slice(0, 16) +
		"...",
);

// Hardened derivation - index >= 2^31 (HARDENED_OFFSET)
console.log("\nHardened derivation (index >= 2^31):");
console.log("HARDENED_OFFSET:", HDWallet.HARDENED_OFFSET);

const hardened0 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 0);
const hardened1 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 1);
const hardened2 = HDWallet.deriveChild(root, HDWallet.HARDENED_OFFSET + 2);

console.log(
	"  Child 0' (hardened):",
	Hex.fromBytes(HDWallet.getPrivateKey(hardened0)!).toString().slice(0, 16) +
		"...",
);
console.log(
	"  Child 1' (hardened):",
	Hex.fromBytes(HDWallet.getPrivateKey(hardened1)!).toString().slice(0, 16) +
		"...",
);
console.log(
	"  Child 2' (hardened):",
	Hex.fromBytes(HDWallet.getPrivateKey(hardened2)!).toString().slice(0, 16) +
		"...",
);

// Parse index notation
console.log("\nParsing index notation:");
console.log('  "0" parses to:', HDWallet.parseIndex("0"));
console.log('  "44" parses to:', HDWallet.parseIndex("44"));
console.log('  "0\'" parses to:', HDWallet.parseIndex("0'"));
console.log('  "44\'" parses to:', HDWallet.parseIndex("44'"));

// Compare normal vs hardened at same index
const normalKey = HDWallet.getPrivateKey(normal0)!;
const hardenedKey = HDWallet.getPrivateKey(hardened0)!;
const different = !normalKey.every((b, i) => b === hardenedKey[i]);

console.log("\nNormal child 0 != Hardened child 0':", different);

// Security: Public key cannot derive hardened children
console.log("\nSecurity test - public key derivation:");
const xpub = HDWallet.toExtendedPublicKey(root);
const pubOnly = HDWallet.fromPublicExtendedKey(xpub);

console.log(
	"Can derive normal from public key:",
	(() => {
		try {
			HDWallet.deriveChild(pubOnly, 0);
			return true;
		} catch {
			return false;
		}
	})(),
);

console.log(
	"Can derive hardened from public key:",
	(() => {
		try {
			HDWallet.deriveChild(pubOnly, HDWallet.HARDENED_OFFSET);
			return false;
		} catch {
			return true; // Expected to fail
		}
	})()
		? "No (correct!)"
		: "Yes (unsafe!)",
);

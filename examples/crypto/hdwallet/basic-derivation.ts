/**
 * Basic HD Wallet Derivation
 *
 * Demonstrates:
 * - Creating HD wallet from seed
 * - BIP-32 path derivation
 * - Deriving Ethereum addresses (BIP-44)
 * - Hardened vs normal derivation
 * - Extended keys (xprv/xpub)
 */

import * as Bip39 from "../../../src/crypto/Bip39/index.js";
import * as HDWallet from "../../../src/crypto/HDWallet/index.js";
import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import * as Address from "../../../src/primitives/Address/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

console.log("=== Basic HD Wallet Derivation ===\n");

// 1. Create HD wallet from seed
console.log("1. Create HD Wallet from Seed");
console.log("-".repeat(40));

const mnemonic = Bip39.generateMnemonic(256);
const seed = await Bip39.mnemonicToSeed(mnemonic);

console.log(`Mnemonic: ${mnemonic.split(" ").slice(0, 6).join(" ")}...`);
console.log(`Seed: ${Hex.fromBytes(seed).slice(0, 64)}...`);

const root = HDWallet.fromSeed(seed);

console.log("\nHD wallet root created");
console.log(`Has private key: ${HDWallet.getPrivateKey(root) !== null}`);
console.log(`Can derive hardened: ${HDWallet.canDeriveHardened(root)}\n`);

// 2. Derive by path
console.log("2. Derivation by BIP-32 Path");
console.log("-".repeat(40));

const paths = [
	"m/44'/60'/0'/0/0", // Ethereum account 0, address 0
	"m/44'/60'/0'/0/1", // Ethereum account 0, address 1
	"m/44'/60'/0'/0/2", // Ethereum account 0, address 2
	"m/44'/60'/1'/0/0", // Ethereum account 1, address 0
];

console.log("Deriving keys using BIP-32 paths:\n");

for (const path of paths) {
	const hdKey = HDWallet.derivePath(root, path);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) continue;

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);

	console.log(`Path: ${path}`);
	console.log(`  Address: ${Address.toHex(address)}`);
}
console.log();

// 3. Ethereum-specific derivation
console.log("3. Ethereum Address Derivation (BIP-44)");
console.log("-".repeat(40));

console.log("First 5 addresses (account 0):\n");

for (let i = 0; i < 5; i++) {
	const hdKey = HDWallet.deriveEthereum(root, 0, i);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) continue;

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);

	console.log(`Address ${i}: ${Address.toHex(address)}`);
	console.log(`  Path: m/44'/60'/0'/0/${i}`);
	console.log(`  Private key: ${Hex.fromBytes(privateKey).slice(0, 32)}...`);
}
console.log();

// 4. Hardened vs normal derivation
console.log("4. Hardened vs Normal Derivation");
console.log("-".repeat(40));

// Hardened derivation (requires private key)
const hardened = HDWallet.derivePath(root, "m/44'/60'/0'");
console.log("Hardened path: m/44'/60'/0'");
console.log(`  Has private key: ${HDWallet.getPrivateKey(hardened) !== null}`);
console.log(
	`  Can derive hardened children: ${HDWallet.canDeriveHardened(hardened)}`,
);

// Normal derivation (can use public key)
const normal = HDWallet.derivePath(hardened, "m/0/0");
console.log("\nNormal path from hardened: m/0/0");
console.log(`  Has private key: ${HDWallet.getPrivateKey(normal) !== null}`);
console.log(`  Final path: m/44'/60'/0'/0/0\n`);

// 5. Extended keys
console.log("5. Extended Keys (xprv/xpub)");
console.log("-".repeat(40));

const xprv = HDWallet.toExtendedPrivateKey(root);
const xpub = HDWallet.toExtendedPublicKey(root);

console.log("Extended private key (xprv):");
console.log(`  ${xprv.slice(0, 40)}...`);
console.log(`  Length: ${xprv.length} characters`);

console.log("\nExtended public key (xpub):");
console.log(`  ${xpub.slice(0, 40)}...`);
console.log(`  Length: ${xpub.length} characters\n`);

// 6. Import from extended key
console.log("6. Import from Extended Key");
console.log("-".repeat(40));

const importedRoot = HDWallet.fromExtendedKey(xprv);
const importedXprv = HDWallet.toExtendedPrivateKey(importedRoot);

console.log("Imported from xprv:");
console.log(`  Original: ${xprv.slice(0, 40)}...`);
console.log(`  Imported: ${importedXprv.slice(0, 40)}...`);
console.log(`  Match: ${xprv === importedXprv}\n`);

// 7. Public-only wallet (watch-only)
console.log("7. Public-Only Wallet (Watch-Only)");
console.log("-".repeat(40));

const watchOnly = HDWallet.fromPublicExtendedKey(xpub);

console.log("Imported xpub (watch-only):");
console.log(`  Has private key: ${HDWallet.getPrivateKey(watchOnly) !== null}`);
console.log(`  Has public key: ${HDWallet.getPublicKey(watchOnly) !== null}`);
console.log(`  Can derive hardened: ${HDWallet.canDeriveHardened(watchOnly)}`);

// Can derive normal addresses
const watchOnlyChild = HDWallet.deriveChild(watchOnly, 0);
const watchOnlyPubKey = HDWallet.getPublicKey(watchOnlyChild);

console.log("\nDerived address from xpub:");
console.log(
	`  Public key: ${watchOnlyPubKey ? Hex.fromBytes(watchOnlyPubKey).slice(0, 32) + "..." : "null"}`,
);
console.log(
	`  Private key: ${HDWallet.getPrivateKey(watchOnlyChild) ? "Available" : "Not available (expected)"}\n`,
);

// 8. Path validation
console.log("8. Path Validation");
console.log("-".repeat(40));

const validPaths = ["m/44'/60'/0'/0/0", "m/0", "m/44h/60h/0h/0/0"];

const invalidPaths = [
	"44'/60'/0'", // Missing 'm'
	"m/44'/60'/a", // Invalid character
	"invalid", // Not a path
];

console.log("Valid paths:");
for (const path of validPaths) {
	console.log(
		`  ${path.padEnd(20)} → ${HDWallet.isValidPath(path) ? "✓" : "✗"}`,
	);
}

console.log("\nInvalid paths:");
for (const path of invalidPaths) {
	console.log(
		`  ${path.padEnd(20)} → ${HDWallet.isValidPath(path) ? "✗ Accepted (unexpected)" : "✓ Rejected"}`,
	);
}
console.log();

// 9. Index parsing
console.log("9. Index Parsing (Hardened Notation)");
console.log("-".repeat(40));

console.log("Index string → numeric value:");
console.log(`  "0"    → ${HDWallet.parseIndex("0")}`);
console.log(`  "44"   → ${HDWallet.parseIndex("44")}`);
console.log(`  "0'"   → ${HDWallet.parseIndex("0'")} (hardened, 2^31)`);
console.log(`  "0h"   → ${HDWallet.parseIndex("0h")} (hardened, 2^31)`);
console.log(`  "60'"  → ${HDWallet.parseIndex("60'")} (hardened, 2^31 + 60)`);
console.log(
	`  "100'" → ${HDWallet.parseIndex("100'")} (hardened, 2^31 + 100)\n`,
);

// 10. Multi-account structure
console.log("10. Multi-Account HD Wallet Structure");
console.log("-".repeat(40));

console.log("BIP-44 hierarchy:");
console.log("  m / purpose' / coin_type' / account' / change / address_index");
console.log("      44'        60'          0-N'       0-1     0-N\n");

console.log("Examples:");
console.log("  m/44'/60'/0'/0/0  → Ethereum account 0, receive address 0");
console.log("  m/44'/60'/0'/0/1  → Ethereum account 0, receive address 1");
console.log("  m/44'/60'/0'/1/0  → Ethereum account 0, change address 0");
console.log("  m/44'/60'/1'/0/0  → Ethereum account 1, receive address 0");
console.log("  m/44'/0'/0'/0/0   → Bitcoin account 0, receive address 0\n");

console.log("Deriving multiple accounts:");
for (let account = 0; account < 3; account++) {
	const hdKey = HDWallet.deriveEthereum(root, account, 0);
	const privateKey = HDWallet.getPrivateKey(hdKey);
	if (!privateKey) continue;

	const publicKey = Secp256k1.derivePublicKey(privateKey);
	const address = Address.fromPublicKey(publicKey);

	console.log(`  Account ${account}: ${Address.toHex(address)}`);
}
console.log();

console.log("=== Complete ===");

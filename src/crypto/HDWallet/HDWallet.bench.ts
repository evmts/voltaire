/**
 * Benchmark: HDWallet (BIP-32/BIP-44) Operations
 * Measures performance of hierarchical deterministic key derivation
 */

import { bench, run } from "mitata";
import { HDWallet } from "./index.js";
import * as Bip39 from "../Bip39/index.js";

// =============================================================================
// Test Data
// =============================================================================

const testMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const testSeed = Bip39.mnemonicToSeedSync(testMnemonic);
const rootKey = HDWallet.fromSeed(testSeed);

// Extended keys
const xprv = HDWallet.toExtendedPrivateKey(rootKey);
const xpub = HDWallet.toExtendedPublicKey(rootKey);

// Pre-derived keys at various depths
const depth1 = HDWallet.derivePath(rootKey, "m/44'");
const depth3 = HDWallet.derivePath(rootKey, "m/44'/60'/0'");
const depth5 = HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/0");

console.log("=".repeat(80));
console.log("HDWallet (BIP-32/BIP-44) Benchmark");
console.log("=".repeat(80));
console.log("");

// =============================================================================
// 1. Seed → Root Key
// =============================================================================

console.log("1. fromSeed - Create root key from seed");
console.log("-".repeat(80));

bench("fromSeed - 16 bytes", () => {
	HDWallet.fromSeed(testSeed.slice(0, 16));
});

bench("fromSeed - 32 bytes", () => {
	HDWallet.fromSeed(testSeed.slice(0, 32));
});

bench("fromSeed - 64 bytes", () => {
	HDWallet.fromSeed(testSeed);
});

await run();
console.log("");

// =============================================================================
// 2. Extended Key Parsing
// =============================================================================

console.log("2. Extended Key Parsing");
console.log("-".repeat(80));

bench("fromExtendedKey - xprv", () => {
	HDWallet.fromExtendedKey(xprv);
});

bench("fromPublicExtendedKey - xpub", () => {
	HDWallet.fromPublicExtendedKey(xpub);
});

await run();
console.log("");

// =============================================================================
// 3. Key Derivation by Depth
// =============================================================================

console.log("3. derivePath - Key derivation by depth");
console.log("-".repeat(80));

bench("derivePath - depth 1 (m/44')", () => {
	HDWallet.derivePath(rootKey, "m/44'");
});

bench("derivePath - depth 3 (m/44'/60'/0')", () => {
	HDWallet.derivePath(rootKey, "m/44'/60'/0'");
});

bench("derivePath - depth 5 (m/44'/60'/0'/0/0)", () => {
	HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/0");
});

bench("derivePath - depth 10", () => {
	HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/0/1/2/3/4/5");
});

await run();
console.log("");

// =============================================================================
// 4. Hardened vs Non-hardened
// =============================================================================

console.log("4. Hardened vs Non-hardened Derivation");
console.log("-".repeat(80));

bench("deriveChild - non-hardened (0)", () => {
	HDWallet.deriveChild(rootKey, 0);
});

bench("deriveChild - hardened (0x80000000)", () => {
	HDWallet.deriveChild(rootKey, HDWallet.HARDENED_OFFSET);
});

bench("derivePath - all hardened (m/44'/60'/0')", () => {
	HDWallet.derivePath(rootKey, "m/44'/60'/0'");
});

bench("derivePath - mixed (m/44'/60'/0'/0/0)", () => {
	HDWallet.derivePath(rootKey, "m/44'/60'/0'/0/0");
});

await run();
console.log("");

// =============================================================================
// 5. BIP-44 Ethereum Derivation
// =============================================================================

console.log("5. BIP-44 Ethereum Derivation");
console.log("-".repeat(80));

bench("deriveEthereum - account 0, index 0", () => {
	HDWallet.deriveEthereum(rootKey, 0, 0);
});

bench("deriveEthereum - account 0, index 100", () => {
	HDWallet.deriveEthereum(rootKey, 0, 100);
});

bench("deriveEthereum - account 5, index 10", () => {
	HDWallet.deriveEthereum(rootKey, 5, 10);
});

await run();
console.log("");

// =============================================================================
// 6. Key Extraction
// =============================================================================

console.log("6. Key Extraction");
console.log("-".repeat(80));

bench("getPrivateKey", () => {
	HDWallet.getPrivateKey(depth5);
});

bench("getPublicKey", () => {
	HDWallet.getPublicKey(depth5);
});

bench("getChainCode", () => {
	HDWallet.getChainCode(depth5);
});

await run();
console.log("");

// =============================================================================
// 7. Serialization
// =============================================================================

console.log("7. Serialization to Extended Keys");
console.log("-".repeat(80));

bench("toExtendedPrivateKey", () => {
	HDWallet.toExtendedPrivateKey(depth5);
});

bench("toExtendedPublicKey", () => {
	HDWallet.toExtendedPublicKey(depth5);
});

bench("toPublic - convert to public key only", () => {
	HDWallet.toPublic(depth5);
});

await run();
console.log("");

// =============================================================================
// 8. Path Utilities
// =============================================================================

console.log("8. Path Utilities");
console.log("-".repeat(80));

bench("isValidPath - valid", () => {
	HDWallet.isValidPath("m/44'/60'/0'/0/0");
});

bench("isValidPath - invalid", () => {
	HDWallet.isValidPath("invalid/path");
});

bench("isHardenedPath - hardened", () => {
	HDWallet.isHardenedPath("m/44'/60'/0'");
});

bench("isHardenedPath - non-hardened", () => {
	HDWallet.isHardenedPath("m/44'/60'/0'/0/0");
});

bench("parseIndex - hardened", () => {
	HDWallet.parseIndex("44'");
});

bench("parseIndex - non-hardened", () => {
	HDWallet.parseIndex("0");
});

await run();
console.log("");

// =============================================================================
// 9. Batch Derivation - Multiple Addresses
// =============================================================================

console.log("9. Batch Derivation - Generate 100 Ethereum addresses");
console.log("-".repeat(80));

bench("Derive 100 addresses (account 0, indices 0-99)", () => {
	for (let i = 0; i < 100; i++) {
		HDWallet.deriveEthereum(rootKey, 0, i);
	}
});

bench("Derive 10 addresses from pre-derived account", () => {
	for (let i = 0; i < 10; i++) {
		HDWallet.deriveChild(depth3, i);
	}
});

await run();
console.log("");

// =============================================================================
// 10. Full Workflow - Mnemonic → Addresses
// =============================================================================

console.log("10. Full Workflow - Mnemonic → Ethereum Addresses");
console.log("-".repeat(80));

bench("Full: mnemonic → seed → root → derive address", () => {
	const seed = Bip39.mnemonicToSeedSync(testMnemonic);
	const root = HDWallet.fromSeed(seed);
	HDWallet.deriveEthereum(root, 0, 0);
});

bench("Full: seed → root → derive 5 addresses", () => {
	const root = HDWallet.fromSeed(testSeed);
	for (let i = 0; i < 5; i++) {
		HDWallet.deriveEthereum(root, 0, i);
	}
});

await run();
console.log("");

// =============================================================================
// 11. Edge Cases
// =============================================================================

console.log("11. Edge Cases");
console.log("-".repeat(80));

bench("deriveChild - max non-hardened index", () => {
	HDWallet.deriveChild(rootKey, HDWallet.HARDENED_OFFSET - 1);
});

bench("deriveChild - max hardened index", () => {
	HDWallet.deriveChild(rootKey, 0xFFFFFFFF);
});

bench("fromSeed - invalid length (error)", () => {
	try {
		HDWallet.fromSeed(new Uint8Array(8));
	} catch {
		// Expected
	}
});

bench("derivePath - invalid path (error)", () => {
	try {
		HDWallet.derivePath(rootKey, "invalid");
	} catch {
		// Expected
	}
});

await run();
console.log("");

console.log("=".repeat(80));
console.log("Benchmark Complete - HDWallet Operations");
console.log("=".repeat(80));

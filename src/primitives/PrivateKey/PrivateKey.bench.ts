/**
 * PrivateKey Performance Benchmarks - SLICE 2
 *
 * Benchmarks for private key operations:
 * - voltaire (default JS)
 * - viem (reference)
 * - ethers (reference)
 */

import { bench, run } from "mitata";

// viem comparison
import { privateKeyToAccount } from "viem/accounts";

// ethers comparison
import { Wallet } from "ethers";

// Use dist build to avoid source module issues
import * as PrivateKey from "../../../dist/primitives/PrivateKey/index.js";

// ============================================================================
// Test Data
// ============================================================================

// Standard test private key (DO NOT USE IN PRODUCTION)
const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_PRIVATE_KEY_BYTES = new Uint8Array([
	0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3, 0x6b, 0xa4, 0xa6, 0xb4, 0xd2,
	0x38, 0xff, 0x94, 0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfc, 0xae, 0x78,
	0x4d, 0x7b, 0xf4, 0xf2, 0xff, 0x80,
]);

// Pre-created instances
const viemAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
const ethersWallet = new Wallet(TEST_PRIVATE_KEY);
const voltaireKey = PrivateKey.from(TEST_PRIVATE_KEY);

// ============================================================================
// Construction: from (hex string)
// ============================================================================

bench("PrivateKey.from(hex) - voltaire", () => {
	PrivateKey.from(TEST_PRIVATE_KEY);
});

bench("privateKeyToAccount - viem", () => {
	privateKeyToAccount(TEST_PRIVATE_KEY);
});

bench("new Wallet - ethers", () => {
	new Wallet(TEST_PRIVATE_KEY);
});

await run();

// ============================================================================
// Construction: fromBytes
// ============================================================================

bench("PrivateKey.fromBytes - voltaire", () => {
	PrivateKey.fromBytes(TEST_PRIVATE_KEY_BYTES);
});

await run();

// ============================================================================
// Conversion: toHex
// ============================================================================

bench("PrivateKey.toHex - voltaire", () => {
	PrivateKey.toHex(TEST_PRIVATE_KEY);
});

await run();

// ============================================================================
// Conversion: toPublicKey
// ============================================================================

bench("PrivateKey.toPublicKey - voltaire", () => {
	PrivateKey.toPublicKey(TEST_PRIVATE_KEY);
});

// ethers exposes it via wallet.publicKey
bench("wallet.signingKey.publicKey - ethers", () => {
	new Wallet(TEST_PRIVATE_KEY).signingKey.publicKey;
});

await run();

// ============================================================================
// Conversion: toAddress
// ============================================================================

bench("PrivateKey.toAddress - voltaire", () => {
	PrivateKey.toAddress(TEST_PRIVATE_KEY);
});

bench("account.address - viem", () => {
	privateKeyToAccount(TEST_PRIVATE_KEY).address;
});

bench("wallet.address - ethers", () => {
	new Wallet(TEST_PRIVATE_KEY).address;
});

await run();

// Pre-computed address derivation (no key parsing)
bench("PrivateKey._toAddress (pre-parsed) - voltaire", () => {
	PrivateKey._toAddress.call(voltaireKey);
});

bench("account.address (pre-parsed) - viem", () => {
	viemAccount.address;
});

bench("wallet.address (pre-parsed) - ethers", () => {
	ethersWallet.address;
});

await run();

// ============================================================================
// Batch operations: Multiple key derivations
// ============================================================================

const testKeys = [
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
	"0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
	"0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
];

bench("Batch toAddress (5 keys) - voltaire", () => {
	for (const key of testKeys) {
		PrivateKey.toAddress(key);
	}
});

bench("Batch toAddress (5 keys) - viem", () => {
	for (const key of testKeys) {
		privateKeyToAccount(key as `0x${string}`).address;
	}
});

bench("Batch toAddress (5 keys) - ethers", () => {
	for (const key of testKeys) {
		new Wallet(key).address;
	}
});

await run();

// ============================================================================
// Round-trip: from -> toHex
// ============================================================================

bench("roundtrip hex->key->hex - voltaire", () => {
	PrivateKey.toHex(TEST_PRIVATE_KEY);
});

await run();

// ============================================================================
// Full derivation: key -> publicKey -> address
// ============================================================================

bench("full derivation (key->pubkey->address) - voltaire", () => {
	const pk = PrivateKey.from(TEST_PRIVATE_KEY);
	PrivateKey._toAddress.call(pk);
});

bench("full derivation (key->account->address) - viem", () => {
	const account = privateKeyToAccount(TEST_PRIVATE_KEY);
	account.address;
});

bench("full derivation (key->wallet->address) - ethers", () => {
	const wallet = new Wallet(TEST_PRIVATE_KEY);
	wallet.address;
});

await run();

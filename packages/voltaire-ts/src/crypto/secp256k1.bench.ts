/**
 * Benchmarks for secp256k1/ECDSA operations
 *
 * Compares performance across implementations:
 * - Voltaire TypeScript (Noble-based)
 * - Voltaire WASM (Zig-based)
 * - viem (Noble-based)
 * - ethers (Noble-based)
 * - @noble/curves secp256k1 (reference)
 * - @noble/secp256k1 (standalone)
 */

import { secp256k1 as nobleSecp256k1Curves } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import * as nobleSecp256k1Standalone from "@noble/secp256k1";
import { SigningKey } from "ethers";
import { bench, run } from "mitata";
import { sign as viemSign } from "viem/accounts";
import { recoverPublicKey as viemRecoverPublicKey } from "viem/utils";
import { loadWasm } from "../wasm-loader/loader.js";

// Load WASM before running benchmarks
await loadWasm(new URL("../../wasm/primitives.wasm", import.meta.url));

// Dynamic imports to break circular dependency
const { Secp256k1 } = await import("./Secp256k1/index.js");
const { Secp256k1Wasm } = await import("./secp256k1.wasm.js");

// ============================================================================
// Test Data Setup
// ============================================================================

// Fixed private key (32 bytes)
const TEST_PRIVATE_KEY = new Uint8Array([
	0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c, 0x3e, 0x9c, 0xd8,
	0x4b, 0x8d, 0x8d, 0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c,
	0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
]);

// Private key as hex for viem/ethers
const TEST_PRIVATE_KEY_HEX = `0x${Array.from(TEST_PRIVATE_KEY)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("")}` as `0x${string}`;

// Message hash (32 bytes) - use keccak256 of UTF-8 encoded string
const TEST_MESSAGE_HASH = keccak_256(
	new TextEncoder().encode("Hello, Ethereum!"),
);

// Message hash as hex for viem
const TEST_MESSAGE_HASH_HEX = `0x${Array.from(TEST_MESSAGE_HASH)
	.map((b) => b.toString(16).padStart(2, "0"))
	.join("")}` as `0x${string}`;

// Pre-compute derived values for each implementation
const voltairePublicKey = Secp256k1.derivePublicKey(TEST_PRIVATE_KEY);
const voltaireSignature = Secp256k1.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

const wasmPublicKey = Secp256k1Wasm.derivePublicKey(TEST_PRIVATE_KEY);
const wasmSignature = Secp256k1Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

// Ethers SigningKey instance
const ethersSigningKey = new SigningKey(TEST_PRIVATE_KEY_HEX);
const ethersSignature = ethersSigningKey.sign(TEST_MESSAGE_HASH);

// Noble curves signature (compact 64 bytes for verify)
const nobleCurvesSigBytes = nobleSecp256k1Curves.sign(
	TEST_MESSAGE_HASH,
	TEST_PRIVATE_KEY,
	{ lowS: true, prehash: false },
);
const nobleCurvesPublicKey = nobleSecp256k1Curves.getPublicKey(
	TEST_PRIVATE_KEY,
	false,
);

// Noble curves signature with recovery (65 bytes for recoverPublicKey)
const nobleCurvesRecoveredSigBytes = nobleSecp256k1Curves.sign(
	TEST_MESSAGE_HASH,
	TEST_PRIVATE_KEY,
	{ lowS: true, prehash: false, format: "recovered" },
);

// Parse the recovered signature to use the Signature class methods
const nobleCurvesSig = nobleSecp256k1Curves.Signature.fromBytes(
	nobleCurvesRecoveredSigBytes,
	"recovered",
);

// Noble standalone public key
const _nobleStandalonePublicKey = nobleSecp256k1Standalone.getPublicKey(
	TEST_PRIVATE_KEY,
	false,
);

// Viem signature (will be computed in benchmark since it's async)
// We'll store the result from warmup
let viemSignatureHex: `0x${string}`;

// ============================================================================
// Sign Benchmarks
// ============================================================================

bench("sign - Voltaire TS", () => {
	Secp256k1.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("sign - Voltaire WASM", () => {
	Secp256k1Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("sign - @noble/curves", () => {
	nobleSecp256k1Curves.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY, {
		lowS: true,
		prehash: false,
	});
});

bench("sign - ethers SigningKey", () => {
	ethersSigningKey.sign(TEST_MESSAGE_HASH);
});

// viem sign is async
bench("sign - viem (async)", async () => {
	await viemSign({
		hash: TEST_MESSAGE_HASH_HEX,
		privateKey: TEST_PRIVATE_KEY_HEX,
	});
});

await run();

// ============================================================================
// Verify Benchmarks
// ============================================================================

bench("verify - Voltaire TS", () => {
	Secp256k1.verify(voltaireSignature, TEST_MESSAGE_HASH, voltairePublicKey);
});

bench("verify - Voltaire WASM", () => {
	Secp256k1Wasm.verify(wasmSignature, TEST_MESSAGE_HASH, wasmPublicKey);
});

bench("verify - @noble/curves", () => {
	nobleSecp256k1Curves.verify(
		nobleCurvesSigBytes,
		TEST_MESSAGE_HASH,
		nobleCurvesPublicKey,
		{
			lowS: true,
			prehash: false,
		},
	);
});

// Note: ethers and viem don't have direct verify methods
// They use address recovery + comparison instead

await run();

// ============================================================================
// Recover Public Key Benchmarks
// ============================================================================

// Warmup viem to get signature
viemSignatureHex = await viemSign({
	hash: TEST_MESSAGE_HASH_HEX,
	privateKey: TEST_PRIVATE_KEY_HEX,
	to: "hex",
});

bench("recover - Voltaire TS", () => {
	Secp256k1.recoverPublicKey(voltaireSignature, TEST_MESSAGE_HASH);
});

bench("recover - Voltaire WASM", () => {
	Secp256k1Wasm.recoverPublicKey(wasmSignature, TEST_MESSAGE_HASH);
});

// Noble curves recovery via Signature.recoverPublicKey method
// The signature already has recovery bit from "recovered" format
bench("recover - @noble/curves", () => {
	nobleCurvesSig.recoverPublicKey(TEST_MESSAGE_HASH);
});

// Noble curves recovery via top-level function
bench("recover - @noble/curves (top-level)", () => {
	nobleSecp256k1Curves.recoverPublicKey(
		nobleCurvesRecoveredSigBytes,
		TEST_MESSAGE_HASH,
		{ prehash: false },
	);
});

bench("recover - ethers SigningKey.recoverPublicKey", () => {
	SigningKey.recoverPublicKey(TEST_MESSAGE_HASH, ethersSignature);
});

// viem recovery is async
bench("recover - viem (async)", async () => {
	await viemRecoverPublicKey({
		hash: TEST_MESSAGE_HASH_HEX,
		signature: viemSignatureHex,
	});
});

await run();

// ============================================================================
// Get Public Key / Derive Public Key Benchmarks
// ============================================================================

bench("getPublicKey - Voltaire TS", () => {
	Secp256k1.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("getPublicKey - Voltaire WASM", () => {
	Secp256k1Wasm.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("getPublicKey - @noble/curves", () => {
	nobleSecp256k1Curves.getPublicKey(TEST_PRIVATE_KEY, false);
});

bench("getPublicKey - @noble/secp256k1", () => {
	nobleSecp256k1Standalone.getPublicKey(TEST_PRIVATE_KEY, false);
});

bench("getPublicKey - ethers SigningKey.computePublicKey", () => {
	SigningKey.computePublicKey(TEST_PRIVATE_KEY_HEX);
});

await run();

// ============================================================================
// Validation Benchmarks
// ============================================================================

bench("isValidSignature - Voltaire TS", () => {
	Secp256k1.isValidSignature(voltaireSignature);
});

bench("isValidSignature - Voltaire WASM", () => {
	Secp256k1Wasm.isValidSignature(wasmSignature);
});

bench("isValidPublicKey - Voltaire TS", () => {
	Secp256k1.isValidPublicKey(voltairePublicKey);
});

bench("isValidPublicKey - Voltaire WASM", () => {
	Secp256k1Wasm.isValidPublicKey(wasmPublicKey);
});

bench("isValidPrivateKey - Voltaire TS", () => {
	Secp256k1.isValidPrivateKey(TEST_PRIVATE_KEY);
});

bench("isValidPrivateKey - Voltaire WASM", () => {
	Secp256k1Wasm.isValidPrivateKey(TEST_PRIVATE_KEY);
});

await run();

// ============================================================================
// Signature Serialization Benchmarks
// ============================================================================

bench("Signature.toBytes - Voltaire TS", () => {
	Secp256k1.Signature.toBytes(voltaireSignature);
});

bench("Signature.toBytes - Voltaire WASM", () => {
	Secp256k1Wasm.Signature.toBytes(wasmSignature);
});

bench("Signature.toCompact - Voltaire TS", () => {
	Secp256k1.Signature.toCompact(voltaireSignature);
});

bench("Signature.toCompact - Voltaire WASM", () => {
	Secp256k1Wasm.Signature.toCompact(wasmSignature);
});

const voltaireSignatureBytes = Secp256k1.Signature.toBytes(voltaireSignature);
const wasmSignatureBytes = Secp256k1Wasm.Signature.toBytes(wasmSignature);

bench("Signature.fromBytes - Voltaire TS", () => {
	Secp256k1.Signature.fromBytes(voltaireSignatureBytes);
});

bench("Signature.fromBytes - Voltaire WASM", () => {
	Secp256k1Wasm.Signature.fromBytes(wasmSignatureBytes);
});

const voltaireSignatureCompact =
	Secp256k1.Signature.toCompact(voltaireSignature);
const wasmSignatureCompact = Secp256k1Wasm.Signature.toCompact(wasmSignature);

bench("Signature.fromCompact - Voltaire TS", () => {
	Secp256k1.Signature.fromCompact(
		voltaireSignatureCompact,
		voltaireSignature.v,
	);
});

bench("Signature.fromCompact - Voltaire WASM", () => {
	Secp256k1Wasm.Signature.fromCompact(wasmSignatureCompact, wasmSignature.v);
});

await run();

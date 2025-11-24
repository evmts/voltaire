/**
 * Benchmarks for Ed25519 operations
 *
 * Measures performance of:
 * - Signing operations
 * - Verification operations
 * - Public key derivation
 * - Keypair generation from seed
 * - Comparison between Noble and WASM implementations
 */

import { writeFileSync } from "node:fs";
import { ed25519 } from "@noble/curves/ed25519.js";
import { bench, run } from "mitata";
import { loadWasm } from "../../wasm-loader/loader.js";
import { Ed25519Wasm } from "../ed25519.wasm.js";
import { Ed25519 } from "./Ed25519.js";

// Load WASM before running benchmarks
await loadWasm(
	new URL("../../../zig-out/lib/primitives.wasm", import.meta.url),
);

// Test data
const TEST_SEED = new Uint8Array(32).fill(1);
const TEST_MESSAGE_SMALL = new TextEncoder().encode("Hello, Ethereum!");
const TEST_MESSAGE_MEDIUM = new Uint8Array(256).fill(42);
const TEST_MESSAGE_LARGE = new Uint8Array(1024).fill(99);

// Pre-compute test data
const TEST_KEYPAIR = Ed25519.keypairFromSeed(TEST_SEED);
const TEST_SIGNATURE = Ed25519.sign(TEST_MESSAGE_SMALL, TEST_KEYPAIR.secretKey);

const TEST_KEYPAIR_WASM = Ed25519Wasm.keypairFromSeed(TEST_SEED);
const TEST_SIGNATURE_WASM = Ed25519Wasm.sign(
	TEST_MESSAGE_SMALL,
	TEST_KEYPAIR_WASM.secretKey,
);

// Noble test data
const TEST_KEYPAIR_NOBLE = {
	publicKey: ed25519.getPublicKey(TEST_SEED),
	secretKey: TEST_SEED,
};
const TEST_SIGNATURE_NOBLE = ed25519.sign(TEST_MESSAGE_SMALL, TEST_SEED);

// ============================================================================
// Noble Benchmarks
// ============================================================================

bench("Noble: keypairFromSeed", () => {
	Ed25519.keypairFromSeed(TEST_SEED);
});

bench("Noble: sign - small message (16 bytes)", () => {
	Ed25519.sign(TEST_MESSAGE_SMALL, TEST_KEYPAIR.secretKey);
});

bench("Noble: sign - medium message (256 bytes)", () => {
	Ed25519.sign(TEST_MESSAGE_MEDIUM, TEST_KEYPAIR.secretKey);
});

bench("Noble: sign - large message (1KB)", () => {
	Ed25519.sign(TEST_MESSAGE_LARGE, TEST_KEYPAIR.secretKey);
});

bench("Noble: verify (valid)", () => {
	Ed25519.verify(TEST_SIGNATURE, TEST_MESSAGE_SMALL, TEST_KEYPAIR.publicKey);
});

bench("Noble: verify (invalid - wrong message)", () => {
	const wrongMessage = new TextEncoder().encode("Wrong message");
	Ed25519.verify(TEST_SIGNATURE, wrongMessage, TEST_KEYPAIR.publicKey);
});

bench("Noble: verify (invalid - wrong signature)", () => {
	const wrongSignature = new Uint8Array(64).fill(0xff);
	Ed25519.verify(wrongSignature, TEST_MESSAGE_SMALL, TEST_KEYPAIR.publicKey);
});

bench("Noble: derivePublicKey", () => {
	Ed25519.derivePublicKey(TEST_KEYPAIR.secretKey);
});

bench("Noble: validateSecretKey", () => {
	Ed25519.validateSecretKey(TEST_KEYPAIR.secretKey);
});

bench("Noble: validatePublicKey", () => {
	Ed25519.validatePublicKey(TEST_KEYPAIR.publicKey);
});

bench("Noble: validateSeed", () => {
	Ed25519.validateSeed(TEST_SEED);
});

// ============================================================================
// WASM Benchmarks
// ============================================================================

bench("Wasm: keypairFromSeed", () => {
	Ed25519Wasm.keypairFromSeed(TEST_SEED);
});

bench("Wasm: sign - small message (16 bytes)", () => {
	Ed25519Wasm.sign(TEST_MESSAGE_SMALL, TEST_KEYPAIR_WASM.secretKey);
});

bench("Wasm: sign - medium message (256 bytes)", () => {
	Ed25519Wasm.sign(TEST_MESSAGE_MEDIUM, TEST_KEYPAIR_WASM.secretKey);
});

bench("Wasm: sign - large message (1KB)", () => {
	Ed25519Wasm.sign(TEST_MESSAGE_LARGE, TEST_KEYPAIR_WASM.secretKey);
});

bench("Wasm: verify (valid)", () => {
	Ed25519Wasm.verify(
		TEST_SIGNATURE_WASM,
		TEST_MESSAGE_SMALL,
		TEST_KEYPAIR_WASM.publicKey,
	);
});

bench("Wasm: verify (invalid - wrong message)", () => {
	const wrongMessage = new TextEncoder().encode("Wrong message");
	Ed25519Wasm.verify(
		TEST_SIGNATURE_WASM,
		wrongMessage,
		TEST_KEYPAIR_WASM.publicKey,
	);
});

bench("Wasm: verify (invalid - wrong signature)", () => {
	const wrongSignature = new Uint8Array(64).fill(0xff);
	Ed25519Wasm.verify(
		wrongSignature,
		TEST_MESSAGE_SMALL,
		TEST_KEYPAIR_WASM.publicKey,
	);
});

bench("Wasm: derivePublicKey", () => {
	Ed25519Wasm.derivePublicKey(TEST_KEYPAIR_WASM.secretKey);
});

bench("Wasm: validateSecretKey", () => {
	Ed25519Wasm.validateSecretKey(TEST_KEYPAIR_WASM.secretKey);
});

bench("Wasm: validatePublicKey", () => {
	Ed25519Wasm.validatePublicKey(TEST_KEYPAIR_WASM.publicKey);
});

bench("Wasm: validateSeed", () => {
	Ed25519Wasm.validateSeed(TEST_SEED);
});

// ============================================================================
// @noble/curves direct comparison
// ============================================================================

bench("@noble/curves: getPublicKey (raw)", () => {
	ed25519.getPublicKey(TEST_SEED);
});

bench("@noble/curves: sign (raw)", () => {
	ed25519.sign(TEST_MESSAGE_SMALL, TEST_SEED);
});

bench("@noble/curves: verify (raw)", () => {
	ed25519.verify(
		TEST_SIGNATURE_NOBLE,
		TEST_MESSAGE_SMALL,
		TEST_KEYPAIR_NOBLE.publicKey,
	);
});

// ============================================================================
// Run and export results
// ============================================================================

// Run benchmarks
await run({
	format: "json",
	throw: true,
});

// Note: mitata outputs to stdout with performance comparison
const benchResults = {
	timestamp: new Date().toISOString(),
	implementations: [
		"Noble (@noble/curves)",
		"Wasm (Zig)",
		"@noble/curves (raw)",
	],
	operations: [
		"keypairFromSeed",
		"sign (small message)",
		"sign (medium message)",
		"sign (large message)",
		"verify (valid)",
		"verify (invalid - wrong message)",
		"verify (invalid - wrong signature)",
		"derivePublicKey",
		"validateSecretKey",
		"validatePublicKey",
		"validateSeed",
	],
	note: "Run 'bun run src/crypto/Ed25519/Ed25519.bench.ts' to see detailed results comparing Noble vs Wasm performance",
};

writeFileSync(
	"src/crypto/Ed25519/ed25519-bench-results.json",
	JSON.stringify(benchResults, null, 2),
);

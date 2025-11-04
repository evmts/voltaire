/**
 * Benchmarks for secp256k1/ECDSA operations
 *
 * Measures performance of:
 * - Signing operations
 * - Verification operations
 * - Public key derivation
 * - Public key recovery
 * - Comparison between Noble and WASM implementations
 */

import { bench, run } from "mitata";
import type { Hash } from "../primitives/Hash/index.js";
import * as HashNamespace from "../primitives/Hash/index.js";
import { Secp256k1 } from "./secp256k1.js";
import { Secp256k1Wasm } from "./secp256k1.wasm.js";
const Hash = HashNamespace;
import { writeFileSync } from "node:fs";
import { loadWasm } from "../wasm-loader/loader.js";

// Load WASM before running benchmarks
await loadWasm(new URL("../../zig-out/lib/primitives.wasm", import.meta.url));

// Test data
const TEST_PRIVATE_KEY = new Uint8Array([
	0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c, 0x3e, 0x9c, 0xd8,
	0x4b, 0x8d, 0x8d, 0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c,
	0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
]);

const TEST_MESSAGE_HASH = Hash.keccak256String("Hello, Ethereum!");

const TEST_PUBLIC_KEY = Secp256k1.derivePublicKey(TEST_PRIVATE_KEY);
const TEST_SIGNATURE = Secp256k1.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

const TEST_PUBLIC_KEY_WASM = Secp256k1Wasm.derivePublicKey(TEST_PRIVATE_KEY);
const TEST_SIGNATURE_WASM = Secp256k1Wasm.sign(
	TEST_MESSAGE_HASH,
	TEST_PRIVATE_KEY,
);

// ============================================================================
// Noble Benchmarks
// ============================================================================

bench("Noble: sign", () => {
	Secp256k1.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("Noble: verify (valid)", () => {
	Secp256k1.verify(TEST_SIGNATURE, TEST_MESSAGE_HASH, TEST_PUBLIC_KEY);
});

bench("Noble: verify (invalid)", () => {
	const wrongHash = Hash.keccak256String("Wrong message");
	Secp256k1.verify(TEST_SIGNATURE, wrongHash, TEST_PUBLIC_KEY);
});

bench("Noble: derivePublicKey", () => {
	Secp256k1.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("Noble: recoverPublicKey", () => {
	Secp256k1.recoverPublicKey(TEST_SIGNATURE, TEST_MESSAGE_HASH);
});

bench("Noble: isValidSignature", () => {
	Secp256k1.isValidSignature(TEST_SIGNATURE);
});

bench("Noble: isValidPublicKey", () => {
	Secp256k1.isValidPublicKey(TEST_PUBLIC_KEY);
});

bench("Noble: isValidPrivateKey", () => {
	Secp256k1.isValidPrivateKey(TEST_PRIVATE_KEY);
});

bench("Noble: Signature.toBytes", () => {
	Secp256k1.Signature.toBytes.call(TEST_SIGNATURE);
});

bench("Noble: Signature.toCompact", () => {
	Secp256k1.Signature.toCompact.call(TEST_SIGNATURE);
});

const TEST_SIGNATURE_BYTES = Secp256k1.Signature.toBytes.call(TEST_SIGNATURE);
bench("Noble: Signature.fromBytes", () => {
	Secp256k1.Signature.fromBytes(TEST_SIGNATURE_BYTES);
});

const TEST_SIGNATURE_COMPACT =
	Secp256k1.Signature.toCompact.call(TEST_SIGNATURE);
bench("Noble: Signature.fromCompact", () => {
	Secp256k1.Signature.fromCompact(TEST_SIGNATURE_COMPACT, TEST_SIGNATURE.v);
});

// ============================================================================
// WASM Benchmarks
// ============================================================================

bench("Wasm: sign", () => {
	Secp256k1Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("Wasm: verify (valid)", () => {
	Secp256k1Wasm.verify(
		TEST_SIGNATURE_WASM,
		TEST_MESSAGE_HASH,
		TEST_PUBLIC_KEY_WASM,
	);
});

bench("Wasm: verify (invalid)", () => {
	const wrongHash = Hash.keccak256String("Wrong message");
	Secp256k1Wasm.verify(TEST_SIGNATURE_WASM, wrongHash, TEST_PUBLIC_KEY_WASM);
});

bench("Wasm: derivePublicKey", () => {
	Secp256k1Wasm.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("Wasm: recoverPublicKey", () => {
	Secp256k1Wasm.recoverPublicKey(TEST_SIGNATURE_WASM, TEST_MESSAGE_HASH);
});

bench("Wasm: isValidSignature", () => {
	Secp256k1Wasm.isValidSignature(TEST_SIGNATURE_WASM);
});

bench("Wasm: isValidPublicKey", () => {
	Secp256k1Wasm.isValidPublicKey(TEST_PUBLIC_KEY_WASM);
});

bench("Wasm: isValidPrivateKey", () => {
	Secp256k1Wasm.isValidPrivateKey(TEST_PRIVATE_KEY);
});

bench("Wasm: Signature.toBytes", () => {
	Secp256k1Wasm.Signature.toBytes(TEST_SIGNATURE_WASM);
});

bench("Wasm: Signature.toCompact", () => {
	Secp256k1Wasm.Signature.toCompact(TEST_SIGNATURE_WASM);
});

const TEST_SIGNATURE_BYTES_WASM =
	Secp256k1Wasm.Signature.toBytes(TEST_SIGNATURE_WASM);
bench("Wasm: Signature.fromBytes", () => {
	Secp256k1Wasm.Signature.fromBytes(TEST_SIGNATURE_BYTES_WASM);
});

const TEST_SIGNATURE_COMPACT_WASM =
	Secp256k1Wasm.Signature.toCompact(TEST_SIGNATURE_WASM);
bench("Wasm: Signature.fromCompact", () => {
	Secp256k1Wasm.Signature.fromCompact(
		TEST_SIGNATURE_COMPACT_WASM,
		TEST_SIGNATURE_WASM.v,
	);
});

// ============================================================================
// Run and export results
// ============================================================================

// Run benchmarks
await run({
	format: "json",
	throw: true,
	// percentiles: false,
});

// Note: mitata outputs to stdout with performance comparison
const benchResults = {
	timestamp: new Date().toISOString(),
	implementations: ["Noble (@noble/curves)", "Wasm (Zig)"],
	operations: [
		"sign",
		"verify (valid)",
		"verify (invalid)",
		"derivePublicKey",
		"recoverPublicKey",
		"isValidSignature",
		"isValidPublicKey",
		"isValidPrivateKey",
		"Signature.toBytes",
		"Signature.toCompact",
		"Signature.fromBytes",
		"Signature.fromCompact",
	],
	note: "Run 'bun run src/crypto/secp256k1.bench.ts' to see detailed results comparing Noble vs Wasm performance",
};

writeFileSync(
	"src/crypto/secp256k1-bench-results.json",
	JSON.stringify(benchResults, null, 2),
);

console.log("\nBenchmark comparison complete!");
console.log("Results written to src/crypto/secp256k1-bench-results.json");

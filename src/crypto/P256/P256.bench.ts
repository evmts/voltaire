/**
 * Benchmarks for P256 (secp256r1) operations
 *
 * Measures performance of:
 * - Signing operations
 * - Verification operations
 * - Public key derivation
 * - ECDH key exchange
 * - Comparison between Noble and WASM implementations
 */

import { writeFileSync } from "node:fs";
import { bench, run } from "mitata";
import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { Hash } from "../../primitives/Hash/index.js";
import { loadWasm } from "../../wasm-loader/loader.js";
import { P256 } from "./P256.js";
import { P256Wasm } from "../p256.wasm.js";

// Load WASM before running benchmarks
await loadWasm(
	new URL("../../../zig-out/lib/primitives.wasm", import.meta.url),
);

// Test data
const TEST_PRIVATE_KEY = new Uint8Array([
	0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c, 0x3e, 0x9c, 0xd8,
	0x4b, 0x8d, 0x8d, 0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c,
	0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
]);

const TEST_MESSAGE_HASH = Hash.keccak256String("Hello, Ethereum!");

// Message size tests
const SMALL_MESSAGE = new Uint8Array(32); // 32 bytes
const MEDIUM_MESSAGE = new Uint8Array(256); // 256 bytes
const LARGE_MESSAGE = new Uint8Array(1024); // 1KB

// Pre-compute test data
const TEST_PUBLIC_KEY = P256.derivePublicKey(TEST_PRIVATE_KEY);
const TEST_SIGNATURE = P256.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

const TEST_PUBLIC_KEY_WASM = P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
const TEST_SIGNATURE_WASM = P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

// Noble test data
const TEST_SIGNATURE_NOBLE = p256.sign(
	sha256(TEST_MESSAGE_HASH),
	TEST_PRIVATE_KEY,
);
const TEST_PUBLIC_KEY_NOBLE = p256
	.getPublicKey(TEST_PRIVATE_KEY, false)
	.slice(1); // Strip 0x04 prefix

// ============================================================================
// Noble Benchmarks
// ============================================================================

bench("Noble: sign - 32 bytes", () => {
	P256.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("Noble: sign - 256 bytes", () => {
	const hash = Hash.keccak256(MEDIUM_MESSAGE);
	P256.sign(hash, TEST_PRIVATE_KEY);
});

bench("Noble: sign - 1KB", () => {
	const hash = Hash.keccak256(LARGE_MESSAGE);
	P256.sign(hash, TEST_PRIVATE_KEY);
});

bench("Noble: verify (valid)", () => {
	P256.verify(TEST_SIGNATURE, TEST_MESSAGE_HASH, TEST_PUBLIC_KEY);
});

bench("Noble: verify (invalid)", () => {
	const wrongHash = Hash.keccak256String("Wrong message");
	P256.verify(TEST_SIGNATURE, wrongHash, TEST_PUBLIC_KEY);
});

bench("Noble: derivePublicKey", () => {
	P256.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("Noble: ecdh", () => {
	P256.ecdh(TEST_PRIVATE_KEY, TEST_PUBLIC_KEY);
});

bench("Noble: validatePrivateKey", () => {
	P256.validatePrivateKey(TEST_PRIVATE_KEY);
});

bench("Noble: validatePublicKey", () => {
	P256.validatePublicKey(TEST_PUBLIC_KEY);
});

// ============================================================================
// WASM Benchmarks
// ============================================================================

bench("Wasm: sign - 32 bytes", () => {
	P256Wasm.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("Wasm: sign - 256 bytes", () => {
	const hash = Hash.keccak256(MEDIUM_MESSAGE);
	P256Wasm.sign(hash, TEST_PRIVATE_KEY);
});

bench("Wasm: sign - 1KB", () => {
	const hash = Hash.keccak256(LARGE_MESSAGE);
	P256Wasm.sign(hash, TEST_PRIVATE_KEY);
});

bench("Wasm: verify (valid)", () => {
	P256Wasm.verify(TEST_SIGNATURE_WASM, TEST_MESSAGE_HASH, TEST_PUBLIC_KEY_WASM);
});

bench("Wasm: verify (invalid)", () => {
	const wrongHash = Hash.keccak256String("Wrong message");
	P256Wasm.verify(TEST_SIGNATURE_WASM, wrongHash, TEST_PUBLIC_KEY_WASM);
});

bench("Wasm: derivePublicKey", () => {
	P256Wasm.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("Wasm: ecdh", () => {
	P256Wasm.ecdh(TEST_PRIVATE_KEY, TEST_PUBLIC_KEY_WASM);
});

bench("Wasm: validatePrivateKey", () => {
	P256Wasm.validatePrivateKey(TEST_PRIVATE_KEY);
});

bench("Wasm: validatePublicKey", () => {
	P256Wasm.validatePublicKey(TEST_PUBLIC_KEY_WASM);
});

// ============================================================================
// @noble/curves direct comparison
// ============================================================================

bench("@noble/curves: sign (raw)", () => {
	p256.sign(sha256(TEST_MESSAGE_HASH), TEST_PRIVATE_KEY);
});

bench("@noble/curves: verify (raw)", () => {
	p256.verify(
		TEST_SIGNATURE_NOBLE,
		sha256(TEST_MESSAGE_HASH),
		TEST_PUBLIC_KEY_NOBLE,
	);
});

bench("@noble/curves: getPublicKey (raw)", () => {
	p256.getPublicKey(TEST_PRIVATE_KEY, false);
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
		"sign (32 bytes)",
		"sign (256 bytes)",
		"sign (1KB)",
		"verify (valid)",
		"verify (invalid)",
		"derivePublicKey",
		"ecdh",
		"validatePrivateKey",
		"validatePublicKey",
	],
	note: "Run 'bun run src/crypto/P256/P256.bench.ts' to see detailed results comparing Noble vs Wasm performance",
};

writeFileSync(
	"src/crypto/P256/p256-bench-results.json",
	JSON.stringify(benchResults, null, 2),
);

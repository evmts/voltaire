/**
 * Benchmarks for secp256k1/ECDSA operations
 *
 * Measures performance of:
 * - Signing operations
 * - Verification operations
 * - Public key derivation
 * - Public key recovery
 */

import { bench, run } from "mitata";
import { Secp256k1 } from "./secp256k1.js";
import { Hash } from "../primitives/hash.js";
import { writeFileSync } from "node:fs";

// Test data
const TEST_PRIVATE_KEY = new Uint8Array([
  0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c, 0x3e, 0x9c, 0xd8,
  0x4b, 0x8d, 0x8d, 0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d, 0x8d, 0x0c,
  0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
]);

const TEST_MESSAGE_HASH = Hash.keccak256String("Hello, Ethereum!");

const TEST_PUBLIC_KEY = Secp256k1.derivePublicKey(TEST_PRIVATE_KEY);

const TEST_SIGNATURE = Secp256k1.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);

// ============================================================================
// Benchmarks
// ============================================================================

bench("secp256k1: sign", () => {
  Secp256k1.sign(TEST_MESSAGE_HASH, TEST_PRIVATE_KEY);
});

bench("secp256k1: verify (valid)", () => {
  Secp256k1.verify(TEST_SIGNATURE, TEST_MESSAGE_HASH, TEST_PUBLIC_KEY);
});

bench("secp256k1: verify (invalid)", () => {
  const wrongHash = Hash.keccak256String("Wrong message");
  Secp256k1.verify(TEST_SIGNATURE, wrongHash, TEST_PUBLIC_KEY);
});

bench("secp256k1: derivePublicKey", () => {
  Secp256k1.derivePublicKey(TEST_PRIVATE_KEY);
});

bench("secp256k1: recoverPublicKey", () => {
  Secp256k1.recoverPublicKey(TEST_SIGNATURE, TEST_MESSAGE_HASH);
});

bench("secp256k1: isValidSignature", () => {
  Secp256k1.isValidSignature(TEST_SIGNATURE);
});

bench("secp256k1: isValidPublicKey", () => {
  Secp256k1.isValidPublicKey(TEST_PUBLIC_KEY);
});

bench("secp256k1: isValidPrivateKey", () => {
  Secp256k1.isValidPrivateKey(TEST_PRIVATE_KEY);
});

bench("secp256k1: Signature.toBytes", () => {
  Secp256k1.Signature.toBytes.call(TEST_SIGNATURE);
});

bench("secp256k1: Signature.toCompact", () => {
  Secp256k1.Signature.toCompact.call(TEST_SIGNATURE);
});

const TEST_SIGNATURE_BYTES = Secp256k1.Signature.toBytes.call(TEST_SIGNATURE);
bench("secp256k1: Signature.fromBytes", () => {
  Secp256k1.Signature.fromBytes(TEST_SIGNATURE_BYTES);
});

const TEST_SIGNATURE_COMPACT =
  Secp256k1.Signature.toCompact.call(TEST_SIGNATURE);
bench("secp256k1: Signature.fromCompact", () => {
  Secp256k1.Signature.fromCompact(TEST_SIGNATURE_COMPACT, TEST_SIGNATURE.v);
});

// ============================================================================
// Run and export results
// ============================================================================

// Run benchmarks
await run({
  format: "json",
  throw: true,
  percentiles: false,
});

// Note: mitata outputs to stdout, capture manually if needed
// For now, we'll create a simple results file
const results = {
  timestamp: new Date().toISOString(),
  benchmarks: {
    sign: "See stdout for results",
    verify_valid: "See stdout for results",
    verify_invalid: "See stdout for results",
    derivePublicKey: "See stdout for results",
    recoverPublicKey: "See stdout for results",
    isValidSignature: "See stdout for results",
    isValidPublicKey: "See stdout for results",
    isValidPrivateKey: "See stdout for results",
    toBytes: "See stdout for results",
    toCompact: "See stdout for results",
    fromBytes: "See stdout for results",
    fromCompact: "See stdout for results",
  },
  note: "Run 'bun run src/crypto/secp256k1.bench.ts' to see detailed results",
};

writeFileSync(
  "src/crypto/secp256k1-bench-results.json",
  JSON.stringify(results, null, 2),
);

console.log("\nResults written to src/crypto/secp256k1-bench-results.json");

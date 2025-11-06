/**
 * Benchmark: Signature Performance
 * Measures performance of Signature operations across different algorithms
 */

import { bench, run } from "mitata";
import * as Signature from "./index.js";

// =============================================================================
// Test Data
// =============================================================================

// secp256k1 test data
const secp256k1_r = new Uint8Array(32);
const secp256k1_s = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	secp256k1_r[i] = i + 1;
	secp256k1_s[i] = i + 33;
}
const secp256k1_v = 27;

// Non-canonical secp256k1 signature (s > n/2)
const secp256k1_s_noncanonical = new Uint8Array([
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
	0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
	0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
	0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x40,
]);

// P256 test data
const p256_r = new Uint8Array(32);
const p256_s = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	p256_r[i] = i + 65;
	p256_s[i] = i + 97;
}

// Ed25519 test data
const ed25519_sig = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
	ed25519_sig[i] = i + 129;
}

// Compact format (64 bytes)
const compactBytes = new Uint8Array(64);
for (let i = 0; i < 64; i++) {
	compactBytes[i] = i + 1;
}

// DER format test data (72 bytes - typical max size)
const derBytes = new Uint8Array([
	0x30, 0x46, // SEQUENCE, length 70
	0x02, 0x21, // INTEGER r, length 33
	0x00, // padding
	...secp256k1_r,
	0x02, 0x21, // INTEGER s, length 33
	0x00, // padding
	...secp256k1_s,
]);

// Pre-created signatures for conversion benchmarks
const sig_secp256k1 = Signature.fromSecp256k1(secp256k1_r, secp256k1_s, secp256k1_v);
const sig_secp256k1_nocanonical = Signature.fromSecp256k1(secp256k1_r, secp256k1_s_noncanonical, secp256k1_v);
const sig_p256 = Signature.fromP256(p256_r, p256_s);
const sig_ed25519 = Signature.fromEd25519(ed25519_sig);

// Multiple signatures for batch operations
const signatures_batch = Array.from({ length: 100 }, (_, i) => {
	const r = new Uint8Array(32).fill(i);
	const s = new Uint8Array(32).fill(i + 100);
	return Signature.fromSecp256k1(r, s, 27);
});

console.log("=".repeat(80));
console.log("Signature Implementation Benchmark");
console.log("=".repeat(80));
console.log("");

// =============================================================================
// 1. Signature.fromSecp256k1 - Create from secp256k1 components
// =============================================================================

console.log("1. Signature.fromSecp256k1 - Create from secp256k1 components");
console.log("-".repeat(80));

bench("Signature.fromSecp256k1 - with v", () => {
	Signature.fromSecp256k1(secp256k1_r, secp256k1_s, secp256k1_v);
});

bench("Signature.fromSecp256k1 - without v", () => {
	Signature.fromSecp256k1(secp256k1_r, secp256k1_s);
});

await run();
console.log("");

// =============================================================================
// 2. Signature.fromP256 - Create from P256 components
// =============================================================================

console.log("2. Signature.fromP256 - Create from P256 components");
console.log("-".repeat(80));

bench("Signature.fromP256", () => {
	Signature.fromP256(p256_r, p256_s);
});

await run();
console.log("");

// =============================================================================
// 3. Signature.fromEd25519 - Create from Ed25519 signature
// =============================================================================

console.log("3. Signature.fromEd25519 - Create from Ed25519 signature");
console.log("-".repeat(80));

bench("Signature.fromEd25519", () => {
	Signature.fromEd25519(ed25519_sig);
});

await run();
console.log("");

// =============================================================================
// 4. Signature.fromCompact - Create from compact format
// =============================================================================

console.log("4. Signature.fromCompact - Create from compact format");
console.log("-".repeat(80));

bench("Signature.fromCompact - secp256k1", () => {
	Signature.fromCompact(compactBytes, "secp256k1");
});

bench("Signature.fromCompact - p256", () => {
	Signature.fromCompact(compactBytes, "p256");
});

bench("Signature.fromCompact - ed25519", () => {
	Signature.fromCompact(compactBytes, "ed25519");
});

await run();
console.log("");

// =============================================================================
// 5. Signature.fromDER - Parse DER format
// =============================================================================

console.log("5. Signature.fromDER - Parse DER format");
console.log("-".repeat(80));

bench("Signature.fromDER - secp256k1", () => {
	Signature.fromDER(derBytes, "secp256k1");
});

bench("Signature.fromDER - p256", () => {
	Signature.fromDER(derBytes, "p256");
});

await run();
console.log("");

// =============================================================================
// 6. Signature.from - Universal constructor
// =============================================================================

console.log("6. Signature.from - Universal constructor");
console.log("-".repeat(80));

bench("Signature.from - Uint8Array", () => {
	Signature.from(compactBytes);
});

bench("Signature.from - object {r, s, v}", () => {
	Signature.from({ r: secp256k1_r, s: secp256k1_s, v: secp256k1_v, algorithm: "secp256k1" });
});

bench("Signature.from - Ed25519 object", () => {
	Signature.from({ signature: ed25519_sig, algorithm: "ed25519" });
});

bench("Signature.from - existing signature", () => {
	Signature.from(sig_secp256k1);
});

await run();
console.log("");

// =============================================================================
// 7. signature.toBytes - Convert to bytes
// =============================================================================

console.log("7. signature.toBytes - Convert to bytes");
console.log("-".repeat(80));

bench("signature.toBytes - secp256k1", () => {
	Signature.toBytes(sig_secp256k1);
});

bench("signature.toBytes - p256", () => {
	Signature.toBytes(sig_p256);
});

bench("signature.toBytes - ed25519", () => {
	Signature.toBytes(sig_ed25519);
});

await run();
console.log("");

// =============================================================================
// 8. signature.toCompact - Convert to compact format
// =============================================================================

console.log("8. signature.toCompact - Convert to compact format");
console.log("-".repeat(80));

bench("signature.toCompact - secp256k1", () => {
	Signature.toCompact(sig_secp256k1);
});

bench("signature.toCompact - p256", () => {
	Signature.toCompact(sig_p256);
});

bench("signature.toCompact - ed25519", () => {
	Signature.toCompact(sig_ed25519);
});

await run();
console.log("");

// =============================================================================
// 9. signature.toDER - Convert to DER format
// =============================================================================

console.log("9. signature.toDER - Convert to DER format");
console.log("-".repeat(80));

bench("signature.toDER - secp256k1", () => {
	Signature.toDER(sig_secp256k1);
});

bench("signature.toDER - p256", () => {
	Signature.toDER(sig_p256);
});

await run();
console.log("");

// =============================================================================
// 10. Signature.getAlgorithm - Get signature algorithm
// =============================================================================

console.log("10. Signature.getAlgorithm - Get signature algorithm");
console.log("-".repeat(80));

bench("Signature.getAlgorithm - secp256k1", () => {
	Signature.getAlgorithm(sig_secp256k1);
});

bench("Signature.getAlgorithm - p256", () => {
	Signature.getAlgorithm(sig_p256);
});

bench("Signature.getAlgorithm - ed25519", () => {
	Signature.getAlgorithm(sig_ed25519);
});

await run();
console.log("");

// =============================================================================
// 11. Signature.getR/getS/getV - Get signature components
// =============================================================================

console.log("11. Signature.getR/getS/getV - Get signature components");
console.log("-".repeat(80));

bench("Signature.getR - secp256k1", () => {
	Signature.getR(sig_secp256k1);
});

bench("Signature.getS - secp256k1", () => {
	Signature.getS(sig_secp256k1);
});

bench("Signature.getV - secp256k1", () => {
	Signature.getV(sig_secp256k1);
});

await run();
console.log("");

// =============================================================================
// 12. Signature.isCanonical - Check if signature is canonical
// =============================================================================

console.log("12. Signature.isCanonical - Check if signature is canonical");
console.log("-".repeat(80));

bench("Signature.isCanonical - canonical", () => {
	Signature.isCanonical(sig_secp256k1);
});

bench("Signature.isCanonical - non-canonical", () => {
	Signature.isCanonical(sig_secp256k1_nocanonical);
});

bench("Signature.isCanonical - ed25519 (always canonical)", () => {
	Signature.isCanonical(sig_ed25519);
});

await run();
console.log("");

// =============================================================================
// 13. Signature.normalize - Normalize to canonical form
// =============================================================================

console.log("13. Signature.normalize - Normalize to canonical form");
console.log("-".repeat(80));

bench("Signature.normalize - already canonical", () => {
	Signature.normalize(sig_secp256k1);
});

bench("Signature.normalize - non-canonical", () => {
	Signature.normalize(sig_secp256k1_nocanonical);
});

bench("Signature.normalize - p256", () => {
	Signature.normalize(sig_p256);
});

bench("Signature.normalize - ed25519 (no-op)", () => {
	Signature.normalize(sig_ed25519);
});

await run();
console.log("");

// =============================================================================
// 14. Signature.equals - Compare signatures
// =============================================================================

console.log("14. Signature.equals - Compare signatures");
console.log("-".repeat(80));

bench("Signature.equals - same signature", () => {
	Signature.equals(sig_secp256k1, sig_secp256k1);
});

bench("Signature.equals - different signatures", () => {
	Signature.equals(sig_secp256k1, sig_p256);
});

bench("Signature.equals - different algorithms", () => {
	Signature.equals(sig_secp256k1, sig_ed25519);
});

await run();
console.log("");

// =============================================================================
// 15. Signature.is - Type guard
// =============================================================================

console.log("15. Signature.is - Type guard");
console.log("-".repeat(80));

bench("Signature.is - valid signature", () => {
	Signature.is(sig_secp256k1);
});

bench("Signature.is - invalid (bytes)", () => {
	Signature.is(compactBytes);
});

bench("Signature.is - invalid (null)", () => {
	Signature.is(null);
});

await run();
console.log("");

// =============================================================================
// 16. Edge Cases - Invalid inputs
// =============================================================================

console.log("16. Edge Cases - Invalid inputs");
console.log("-".repeat(80));

bench("fromSecp256k1 - invalid r length (error)", () => {
	try {
		Signature.fromSecp256k1(new Uint8Array(31), secp256k1_s, secp256k1_v);
	} catch {
		// Expected
	}
});

bench("fromSecp256k1 - invalid s length (error)", () => {
	try {
		Signature.fromSecp256k1(secp256k1_r, new Uint8Array(31), secp256k1_v);
	} catch {
		// Expected
	}
});

bench("fromCompact - invalid length (error)", () => {
	try {
		Signature.fromCompact(new Uint8Array(63), "secp256k1");
	} catch {
		// Expected
	}
});

bench("fromDER - invalid format (error)", () => {
	try {
		Signature.fromDER(new Uint8Array([0x30, 0x00]), "secp256k1");
	} catch {
		// Expected
	}
});

await run();
console.log("");

// =============================================================================
// 17. Batch Operations - Process multiple signatures
// =============================================================================

console.log("17. Batch Operations - Process multiple signatures");
console.log("-".repeat(80));

bench("Batch - normalize 10 signatures", () => {
	for (let i = 0; i < 10; i++) {
		Signature.normalize(signatures_batch[i]!);
	}
});

bench("Batch - isCanonical check 100 signatures", () => {
	for (let i = 0; i < 100; i++) {
		Signature.isCanonical(signatures_batch[i]!);
	}
});

bench("Batch - toCompact 100 signatures", () => {
	for (let i = 0; i < 100; i++) {
		Signature.toCompact(signatures_batch[i]!);
	}
});

bench("Batch - toDER 100 signatures", () => {
	for (let i = 0; i < 100; i++) {
		Signature.toDER(signatures_batch[i]!);
	}
});

await run();
console.log("");

// =============================================================================
// 18. Algorithm-specific operations
// =============================================================================

console.log("18. Algorithm-specific operations");
console.log("-".repeat(80));

bench("secp256k1 - full roundtrip (create → normalize → toDER)", () => {
	const sig = Signature.fromSecp256k1(secp256k1_r, secp256k1_s, secp256k1_v);
	const normalized = Signature.normalize(sig);
	Signature.toDER(normalized);
});

bench("p256 - full roundtrip (create → normalize → toDER)", () => {
	const sig = Signature.fromP256(p256_r, p256_s);
	const normalized = Signature.normalize(sig);
	Signature.toDER(normalized);
});

bench("ed25519 - full roundtrip (create → toCompact)", () => {
	const sig = Signature.fromEd25519(ed25519_sig);
	Signature.toCompact(sig);
});

await run();
console.log("");

console.log("=".repeat(80));
console.log("Benchmark Complete - Signature Operations");
console.log("=".repeat(80));

/**
 * BN254 Point Serialization
 *
 * G1 points serialize to 64 bytes: x (32 bytes) || y (32 bytes)
 * G2 points serialize to 128 bytes: x.c0 (32) || x.c1 (32) || y.c0 (32) || y.c1 (32)
 *
 * Coordinates are big-endian encoded, left-padded to 32 bytes.
 *
 * The point at infinity serializes as all zeros.
 *
 * This format matches Ethereum's bn256 precompile input/output format.
 *
 * Note: Some implementations use compressed format (just x + sign bit),
 * but Ethereum precompiles use uncompressed format.
 */

import { BN254 } from "@tevm/voltaire";

const { G1, G2, serializeG1, deserializeG1, serializeG2, deserializeG2 } =
	BN254;

console.log("=== BN254 Point Serialization ===\n");

// Helper to display bytes as hex
function toHex(bytes: Uint8Array): string {
	return (
		"0x" +
		Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
	);
}

// G1 Serialization
console.log("G1 Point Serialization (64 bytes):\n");

const g1 = G1.generator();
const g1Bytes = serializeG1(g1);
console.log("  Generator (1, 2):");
console.log("  Length:", g1Bytes.length, "bytes");
console.log("  x (first 32 bytes):", toHex(g1Bytes.slice(0, 32)));
console.log("  y (last 32 bytes):", toHex(g1Bytes.slice(32, 64)));
console.log();

// Verify deserialization roundtrip
const g1Deserialized = deserializeG1(g1Bytes);
console.log("  Roundtrip check:", G1.equal(g1, g1Deserialized), "\n");

// G1 with larger coordinates
const g1_42 = G1.mul(g1, 42n);
const g1_42Bytes = serializeG1(g1_42);
console.log("  42*G:");
console.log("  x:", toHex(g1_42Bytes.slice(0, 32)).slice(0, 40) + "...");
console.log("  y:", toHex(g1_42Bytes.slice(32, 64)).slice(0, 40) + "...");
console.log(
	"  Roundtrip check:",
	G1.equal(g1_42, deserializeG1(g1_42Bytes)),
	"\n",
);

// G1 infinity
const g1Inf = G1.infinity();
const g1InfBytes = serializeG1(g1Inf);
console.log("  Infinity point:");
console.log("  Bytes:", toHex(g1InfBytes));
console.log("  Roundtrip check:", G1.isZero(deserializeG1(g1InfBytes)), "\n");

// G2 Serialization
console.log("G2 Point Serialization (128 bytes):\n");

const g2 = G2.generator();
const g2Bytes = serializeG2(g2);
console.log("  Generator:");
console.log("  Length:", g2Bytes.length, "bytes");
console.log("  x.c0:", toHex(g2Bytes.slice(0, 32)).slice(0, 40) + "...");
console.log("  x.c1:", toHex(g2Bytes.slice(32, 64)).slice(0, 40) + "...");
console.log("  y.c0:", toHex(g2Bytes.slice(64, 96)).slice(0, 40) + "...");
console.log("  y.c1:", toHex(g2Bytes.slice(96, 128)).slice(0, 40) + "...");
console.log();

// Verify deserialization roundtrip
const g2Deserialized = deserializeG2(g2Bytes);
console.log("  Roundtrip check:", G2.equal(g2, g2Deserialized), "\n");

// G2 with scalar multiplication
const g2_17 = G2.mul(g2, 17n);
const g2_17Bytes = serializeG2(g2_17);
console.log("  17*G:");
console.log(
	"  Roundtrip check:",
	G2.equal(g2_17, deserializeG2(g2_17Bytes)),
	"\n",
);

// G2 infinity
const g2Inf = G2.infinity();
const g2InfBytes = serializeG2(g2Inf);
console.log("  Infinity point:");
console.log("  First 32 bytes:", toHex(g2InfBytes.slice(0, 32)));
console.log(
	"  All zeros:",
	g2InfBytes.every((b) => b === 0),
);
console.log("  Roundtrip check:", G2.isZero(deserializeG2(g2InfBytes)), "\n");

// Ethereum precompile format note
console.log("Ethereum Precompile Format:");
console.log("  bn256Add (0x06): Input is 128 bytes (two G1 points)");
console.log(
	"  bn256ScalarMul (0x07): Input is 96 bytes (G1 point + 32-byte scalar)",
);
console.log(
	"  bn256Pairing (0x08): Input is multiple of 192 bytes (G1 + G2 pairs)",
);
console.log("    Each pair: 64 bytes G1 + 128 bytes G2 = 192 bytes");

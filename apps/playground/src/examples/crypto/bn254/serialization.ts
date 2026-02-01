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

// Helper to display bytes as hex
function toHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

const g1 = G1.generator();
const g1Bytes = serializeG1(g1);

// Verify deserialization roundtrip
const g1Deserialized = deserializeG1(g1Bytes);

// G1 with larger coordinates
const g1_42 = G1.mul(g1, 42n);
const g1_42Bytes = serializeG1(g1_42);

// G1 infinity
const g1Inf = G1.infinity();
const g1InfBytes = serializeG1(g1Inf);

const g2 = G2.generator();
const g2Bytes = serializeG2(g2);

// Verify deserialization roundtrip
const g2Deserialized = deserializeG2(g2Bytes);

// G2 with scalar multiplication
const g2_17 = G2.mul(g2, 17n);
const g2_17Bytes = serializeG2(g2_17);

// G2 infinity
const g2Inf = G2.infinity();
const g2InfBytes = serializeG2(g2Inf);

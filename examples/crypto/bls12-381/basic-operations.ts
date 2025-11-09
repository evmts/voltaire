import { bls12_381 } from "@noble/curves/bls12-381.js";

/**
 * Basic BLS12-381 Operations
 *
 * Demonstrates fundamental G1 and G2 point operations:
 * - Point addition (G1 and G2)
 * - Scalar multiplication (G1 and G2)
 * - Point serialization/deserialization
 * - Identity and infinity points
 */

console.log("=== Basic BLS12-381 Operations ===\n");

// Helper: Convert bigint to 32-byte big-endian
function bigIntToBytes32(value: bigint): Uint8Array {
	const bytes = new Uint8Array(32);
	let v = value;
	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes;
}

// Helper: Convert point to hex string
function pointToHex(point: { x: bigint; y: bigint }): string {
	return `(${point.x.toString(16).slice(0, 16)}..., ${point.y.toString(16).slice(0, 16)}...)`;
}

// 1. G1 Point Addition
console.log("1. G1 Point Addition");
console.log("-".repeat(50));

const g1Generator = bls12_381.G1.Point.BASE;
const g1Point1 = g1Generator;
const g1Point2 = g1Generator.multiply(2n);

// Add two G1 points
const g1Sum = g1Point1.add(g1Point2);

console.log("G1 Generator:", pointToHex(g1Generator.toAffine()));
console.log("2 * G1:", pointToHex(g1Point2.toAffine()));
console.log("G1 + 2*G1 = 3*G1:", pointToHex(g1Sum.toAffine()));

// Verify result equals 3*G1
const g1Triple = g1Generator.multiply(3n);
const additionCorrect = g1Sum.equals(g1Triple);
console.log("Addition correct:", additionCorrect, "\n");

// 2. G1 Scalar Multiplication
console.log("2. G1 Scalar Multiplication");
console.log("-".repeat(50));

const scalar = 12345n;
const g1Multiplied = g1Generator.multiply(scalar);

console.log("Scalar:", scalar);
console.log("Result:", pointToHex(g1Multiplied.toAffine()));
console.log(
	"Point is valid:",
	g1Multiplied.assertValidity() === undefined,
	"\n",
);

// 3. G2 Point Addition
console.log("3. G2 Point Addition (Extension Field Fp2)");
console.log("-".repeat(50));

const g2Generator = bls12_381.G2.Point.BASE;
const g2Point1 = g2Generator;
const g2Point2 = g2Generator.multiply(2n);

const g2Sum = g2Point1.add(g2Point2);

console.log(
	"G2 Generator x.c0:",
	g2Generator.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);
console.log(
	"G2 + 2*G2 = 3*G2:",
	pointToHex({
		x: g2Sum.toAffine().x.c0,
		y: g2Sum.toAffine().y.c0,
	}),
);

const g2Triple = g2Generator.multiply(3n);
const g2AdditionCorrect = g2Sum.equals(g2Triple);
console.log("G2 addition correct:", g2AdditionCorrect, "\n");

// 4. G2 Scalar Multiplication
console.log("4. G2 Scalar Multiplication");
console.log("-".repeat(50));

const g2Scalar = 67890n;
const g2Multiplied = g2Generator.multiply(g2Scalar);

console.log("Scalar:", g2Scalar);
console.log(
	"Result x.c0:",
	g2Multiplied.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);
console.log(
	"G2 point is valid:",
	g2Multiplied.assertValidity() === undefined,
	"\n",
);

// 5. Identity Points
console.log("5. Identity Points (Point at Infinity)");
console.log("-".repeat(50));

const g1Identity = bls12_381.G1.Point.ZERO;
const g2Identity = bls12_381.G2.Point.ZERO;

// Adding identity should not change the point
const g1PlusIdentity = g1Generator.add(g1Identity);
const g2PlusIdentity = g2Generator.add(g2Identity);

console.log("G1 + Identity = G1:", g1PlusIdentity.equals(g1Generator));
console.log("G2 + Identity = G2:", g2PlusIdentity.equals(g2Generator));

// Curve order property
const curveOrder = bls12_381.fields.Fr.ORDER;
console.log("Curve order (r):", curveOrder.toString(16).slice(0, 32), "...");
console.log("Property: For any point P, r * P = Identity");
console.log("(Cannot demonstrate directly as scalar must be non-zero)\n");

// 6. Point Serialization
console.log("6. Point Serialization");
console.log("-".repeat(50));

// G1 point: 48 bytes compressed, 96 bytes uncompressed
const g1Compressed = g1Multiplied.toRawBytes(true); // Compressed
const g1Uncompressed = g1Multiplied.toRawBytes(false); // Uncompressed

console.log("G1 compressed size:", g1Compressed.length, "bytes");
console.log("G1 uncompressed size:", g1Uncompressed.length, "bytes");
console.log(
	"G1 compressed:",
	Buffer.from(g1Compressed).toString("hex").slice(0, 32),
	"...",
);

// G2 point: 96 bytes compressed, 192 bytes uncompressed
const g2Compressed = g2Multiplied.toRawBytes(true);
const g2Uncompressed = g2Multiplied.toRawBytes(false);

console.log("\nG2 compressed size:", g2Compressed.length, "bytes");
console.log("G2 uncompressed size:", g2Uncompressed.length, "bytes");
console.log(
	"G2 compressed:",
	Buffer.from(g2Compressed).toString("hex").slice(0, 32),
	"...\n",
);

// 7. Point Deserialization
console.log("7. Point Deserialization (Round-trip)");
console.log("-".repeat(50));

const g1Recovered = bls12_381.G1.Point.fromHex(g1Compressed);
const g2Recovered = bls12_381.G2.Point.fromHex(g2Compressed);

console.log("G1 round-trip successful:", g1Recovered.equals(g1Multiplied));
console.log(
	"G2 round-trip successful:",
	g2Recovered.equals(g2Multiplied),
	"\n",
);

// 8. Scalar Field Properties
console.log("8. Scalar Field Properties");
console.log("-".repeat(50));

// BLS12-381 curve order (already shown above)
console.log("Order bit length:", curveOrder.toString(2).length, "bits");
console.log("All scalar arithmetic is modulo r");
console.log("Scalars must be in range [1, r-1] for multiplication\n");

// 9. Multi-Scalar Multiplication (MSM)
console.log("9. Multi-Scalar Multiplication");
console.log("-".repeat(50));

const scalars = [123n, 456n, 789n];
const g1Points = scalars.map((s) => g1Generator.multiply(s));

// Compute MSM: sum of (scalar_i * point_i)
const msmScalars = [2n, 3n, 5n];
let msmResult = bls12_381.G1.Point.ZERO;
for (let i = 0; i < g1Points.length; i++) {
	msmResult = msmResult.add(g1Points[i].multiply(msmScalars[i]));
}

// Verify: 2*123 + 3*456 + 5*789 = 5569
const expectedScalar = 2n * 123n + 3n * 456n + 5n * 789n;
const expectedPoint = g1Generator.multiply(expectedScalar);

console.log("MSM scalars:", msmScalars.join(", "));
console.log("Expected total scalar:", expectedScalar);
console.log("MSM correct:", msmResult.equals(expectedPoint), "\n");

console.log("=== Complete ===");

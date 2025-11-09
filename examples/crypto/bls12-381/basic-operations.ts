import { bls12_381 } from "@noble/curves/bls12-381.js";

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

const g1Generator = bls12_381.G1.Point.BASE;
const g1Point1 = g1Generator;
const g1Point2 = g1Generator.multiply(2n);

// Add two G1 points
const g1Sum = g1Point1.add(g1Point2);

// Verify result equals 3*G1
const g1Triple = g1Generator.multiply(3n);
const additionCorrect = g1Sum.equals(g1Triple);

const scalar = 12345n;
const g1Multiplied = g1Generator.multiply(scalar);

const g2Generator = bls12_381.G2.Point.BASE;
const g2Point1 = g2Generator;
const g2Point2 = g2Generator.multiply(2n);

const g2Sum = g2Point1.add(g2Point2);

const g2Triple = g2Generator.multiply(3n);
const g2AdditionCorrect = g2Sum.equals(g2Triple);

const g2Scalar = 67890n;
const g2Multiplied = g2Generator.multiply(g2Scalar);

const g1Identity = bls12_381.G1.Point.ZERO;
const g2Identity = bls12_381.G2.Point.ZERO;

// Adding identity should not change the point
const g1PlusIdentity = g1Generator.add(g1Identity);
const g2PlusIdentity = g2Generator.add(g2Identity);

// Curve order property
const curveOrder = bls12_381.fields.Fr.ORDER;

// G1 point: 48 bytes compressed, 96 bytes uncompressed
const g1Compressed = g1Multiplied.toRawBytes(true); // Compressed
const g1Uncompressed = g1Multiplied.toRawBytes(false); // Uncompressed

// G2 point: 96 bytes compressed, 192 bytes uncompressed
const g2Compressed = g2Multiplied.toRawBytes(true);
const g2Uncompressed = g2Multiplied.toRawBytes(false);

const g1Recovered = bls12_381.G1.Point.fromHex(g1Compressed);
const g2Recovered = bls12_381.G2.Point.fromHex(g2Compressed);

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

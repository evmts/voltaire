import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

// BN254 curve parameters
const FIELD_MODULUS =
	21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const GROUP_ORDER =
	21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// G1 generator point
const G1_X = 1n;
const G1_Y = 2n;

/**
 * Convert bigint to 32-byte big-endian
 */
function toBigEndian(value: bigint): Uint8Array {
	const bytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		bytes[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
	return bytes;
}

/**
 * Read bigint from 32-byte big-endian
 */
function fromBigEndian(bytes: Uint8Array): bigint {
	let value = 0n;
	for (let i = 0; i < 32; i++) {
		value = (value << 8n) | BigInt(bytes[i]);
	}
	return value;
}

// Add G1 generator to itself: G + G = 2G
const ecaddInput = new Uint8Array(128);
ecaddInput.set(toBigEndian(G1_X), 0); // x1
ecaddInput.set(toBigEndian(G1_Y), 32); // y1
ecaddInput.set(toBigEndian(G1_X), 64); // x2
ecaddInput.set(toBigEndian(G1_Y), 96); // y2

const ecaddResult = execute(
	PrecompileAddress.BN254_ADD,
	ecaddInput,
	1000n,
	Hardfork.CANCUN,
);

if (ecaddResult.success) {
	const resultX = fromBigEndian(ecaddResult.output.slice(0, 32));
	const resultY = fromBigEndian(ecaddResult.output.slice(32, 64));
} else {
}

const scalar = 42n;

const ecmulInput = new Uint8Array(96);
ecmulInput.set(toBigEndian(G1_X), 0); // x
ecmulInput.set(toBigEndian(G1_Y), 32); // y
ecmulInput.set(toBigEndian(scalar), 64); // scalar

const ecmulResult = execute(
	PrecompileAddress.BN254_MUL,
	ecmulInput,
	10000n,
	Hardfork.CANCUN,
);

if (ecmulResult.success) {
	const resultX = fromBigEndian(ecmulResult.output.slice(0, 32));
	const resultY = fromBigEndian(ecmulResult.output.slice(32, 64));

	// Verify point is on curve: y² = x³ + 3
	const lhs = (resultY * resultY) % FIELD_MODULUS;
	const rhs = (resultX * resultX * resultX + 3n) % FIELD_MODULUS;
	const onCurve = lhs === rhs;
} else {
}

// Add G1 to identity
const identityInput = new Uint8Array(128);
identityInput.set(toBigEndian(G1_X), 0);
identityInput.set(toBigEndian(G1_Y), 32);

const identityResult = execute(
	PrecompileAddress.BN254_ADD,
	identityInput,
	1000n,
	Hardfork.CANCUN,
);

if (identityResult.success) {
	const resultX = fromBigEndian(identityResult.output.slice(0, 32));
	const resultY = fromBigEndian(identityResult.output.slice(32, 64));
} else {
}

const testScalars = [
	{ value: 0n, desc: "Zero (should return infinity)" },
	{ value: 1n, desc: "One (should return G1)" },
	{ value: GROUP_ORDER, desc: "Group order (should return infinity)" },
	{ value: GROUP_ORDER + 1n, desc: "Group order + 1 (should return G1)" },
];

for (const { value, desc } of testScalars) {
	const input = new Uint8Array(96);
	input.set(toBigEndian(G1_X), 0);
	input.set(toBigEndian(G1_Y), 32);
	input.set(toBigEndian(value), 64);

	const result = execute(
		PrecompileAddress.BN254_MUL,
		input,
		10000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
		const x = fromBigEndian(result.output.slice(0, 32));
		const y = fromBigEndian(result.output.slice(32, 64));
		const isInfinity = x === 0n && y === 0n;
		const isG1 = x === G1_X && y === G1_Y;

		let resultDesc = "";
		if (isInfinity) resultDesc = "infinity";
		else if (isG1) resultDesc = "G1";
		else resultDesc = "other point";
	}
}

const mul5Input = new Uint8Array(96);
mul5Input.set(toBigEndian(G1_X), 0);
mul5Input.set(toBigEndian(G1_Y), 32);
mul5Input.set(toBigEndian(5n), 64);

const mul5Result = execute(
	PrecompileAddress.BN254_MUL,
	mul5Input,
	10000n,
	Hardfork.CANCUN,
);

const mul7Input = new Uint8Array(96);
mul7Input.set(toBigEndian(G1_X), 0);
mul7Input.set(toBigEndian(G1_Y), 32);
mul7Input.set(toBigEndian(7n), 64);

const mul7Result = execute(
	PrecompileAddress.BN254_MUL,
	mul7Input,
	10000n,
	Hardfork.CANCUN,
);

if (mul5Result.success && mul7Result.success) {
	const addCombinedInput = new Uint8Array(128);
	addCombinedInput.set(mul5Result.output, 0);
	addCombinedInput.set(mul7Result.output, 64);

	const addCombinedResult = execute(
		PrecompileAddress.BN254_ADD,
		addCombinedInput,
		1000n,
		Hardfork.CANCUN,
	);

	const gas1 =
		mul5Result.gasUsed +
		mul7Result.gasUsed +
		(addCombinedResult.success ? addCombinedResult.gasUsed : 0n);
}

const mul12Input = new Uint8Array(96);
mul12Input.set(toBigEndian(G1_X), 0);
mul12Input.set(toBigEndian(G1_Y), 32);
mul12Input.set(toBigEndian(12n), 64);

const mul12Result = execute(
	PrecompileAddress.BN254_MUL,
	mul12Input,
	10000n,
	Hardfork.CANCUN,
);

if (mul12Result.success) {
}

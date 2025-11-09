import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

// BLS12-381 field modulus
const BLS_MODULUS =
	0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;
const FIELD_ELEMENTS_PER_BLOB = 4096;

/**
 * Simple SHA-256 mock (in real code, use crypto.subtle or library)
 * For demonstration only - shows versioned hash structure
 */
function mockSha256(data: Uint8Array): Uint8Array {
	const hash = new Uint8Array(32);
	// In reality: hash = SHA256(data)
	// For demo, fill with pattern
	for (let i = 0; i < 32; i++) {
		hash[i] = data[i % data.length] ^ (i * 7);
	}
	return hash;
}

/**
 * Create versioned hash from commitment
 */
function createVersionedHash(commitment: Uint8Array): Uint8Array {
	const hash = mockSha256(commitment);
	hash[0] = 0x01; // Version byte for EIP-4844
	return hash;
}

/**
 * Convert bigint to bytes (big-endian, padded to length)
 */
function toBytes(value: bigint, length: number): Uint8Array {
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		bytes[length - 1 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
	}
	return bytes;
}

/**
 * Read bigint from bytes (big-endian)
 */
function fromBytes(bytes: Uint8Array): bigint {
	let value = 0n;
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i]);
	}
	return value;
}

const input1 = new Uint8Array(192);

// Commitment: point at infinity in compressed format
// BLS12-381 compressed infinity = 0xc0 followed by zeros
const commitment1 = new Uint8Array(48);
commitment1[0] = 0xc0; // Infinity marker

// Proof: also point at infinity
const proof1 = new Uint8Array(48);
proof1[0] = 0xc0;

// Versioned hash
const versionedHash1 = createVersionedHash(commitment1);

// z and y are zero (default)
// Assemble input
input1.set(versionedHash1, 0); // versioned_hash
input1.set(new Uint8Array(32), 32); // z = 0
input1.set(new Uint8Array(32), 64); // y = 0
input1.set(commitment1, 96); // commitment (48 bytes)
input1.set(proof1, 144); // proof (48 bytes)

const result1 = execute(
	PrecompileAddress.POINT_EVALUATION,
	input1,
	60000n,
	Hardfork.CANCUN,
);

if (result1.success) {
	// Check output format
	const fieldElements = (result1.output[30] << 8) | result1.output[31];
	const modulusBytes = result1.output.slice(32, 64);
	const modulusValue = fromBytes(modulusBytes);

	const isValid = fieldElements !== 0;
} else {
}

// Test with valid field element
const validFieldElement = BLS_MODULUS - 1n;

// Test with invalid field element (too large)
const invalidFieldElement = BLS_MODULUS + 1n;

const commitment4 = new Uint8Array(48);
commitment4[0] = 0xc0;

const correctHash = createVersionedHash(commitment4);

// Wrong hash (mismatch)
const wrongHash = new Uint8Array(32);
wrongHash[0] = 0x01;
wrongHash[1] = 0xff; // Wrong hash value

const input4 = new Uint8Array(192);
input4.set(wrongHash, 0);
input4.set(commitment4, 96);
input4.set(new Uint8Array(48), 144);
input4[144] = 0xc0;

const result4 = execute(
	PrecompileAddress.POINT_EVALUATION,
	input4,
	60000n,
	Hardfork.CANCUN,
);

// Wrong length
const wrongLength = new Uint8Array(191); // Should be 192
const resultLen = execute(
	PrecompileAddress.POINT_EVALUATION,
	wrongLength,
	60000n,
	Hardfork.CANCUN,
);

// Out of gas
const input6b = new Uint8Array(192);
input6b.set(createVersionedHash(new Uint8Array(48)), 0);
const resultGas = execute(
	PrecompileAddress.POINT_EVALUATION,
	input6b,
	40000n, // Not enough (need 50,000)
	Hardfork.CANCUN,
);

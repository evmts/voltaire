/**
 * ModExp Precompile - RSA Signature Verification
 *
 * Demonstrates:
 * - Simulated RSA-2048 signature verification
 * - Large modular exponentiation operations
 * - Gas cost analysis for real-world RSA
 * - EIP-2565 gas reduction benefits
 */

import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";

// Helper to create ModExp input
function createModExpInput(
	base: Uint8Array,
	exponent: Uint8Array,
	modulus: Uint8Array,
): Uint8Array {
	const input = new Uint8Array(
		96 + base.length + exponent.length + modulus.length,
	);
	const view = new DataView(input.buffer);

	// Set lengths (32 bytes each, big-endian)
	view.setBigUint64(24, BigInt(base.length), false);
	view.setBigUint64(56, BigInt(exponent.length), false);
	view.setBigUint64(88, BigInt(modulus.length), false);

	// Set values
	input.set(base, 96);
	input.set(exponent, 96 + base.length);
	input.set(modulus, 96 + base.length + exponent.length);

	return input;
}

// RSA-2048 uses 256-byte (2048-bit) numbers
const rsaSize = 256;

// Simulate signature (normally this is the signed message hash)
const signature = crypto.getRandomValues(new Uint8Array(rsaSize));
signature[0] = 0x00; // Ensure it's less than modulus

// Common RSA public exponent: 65537 (0x010001)
const exponent = new Uint8Array(3);
exponent[0] = 0x01;
exponent[1] = 0x00;
exponent[2] = 0x01;

// Simulate RSA modulus (public key)
const modulus = crypto.getRandomValues(new Uint8Array(rsaSize));
modulus[0] |= 0x80; // Ensure high bit is set (full 2048 bits)

const rsaInput = createModExpInput(signature, exponent, modulus);

// Execute with sufficient gas
const rsaResult = execute(
	PrecompileAddress.MODEXP,
	rsaInput,
	1000000n,
	Hardfork.CANCUN,
);

if (rsaResult.success) {
}

const rsaSizes = [
	{ bits: 1024, bytes: 128, desc: "RSA-1024" },
	{ bits: 2048, bytes: 256, desc: "RSA-2048" },
	{ bits: 4096, bytes: 512, desc: "RSA-4096" },
];

for (const size of rsaSizes) {
	const sig = crypto.getRandomValues(new Uint8Array(size.bytes));
	sig[0] = 0x00;

	const exp = new Uint8Array(3);
	exp[0] = 0x01;
	exp[1] = 0x00;
	exp[2] = 0x01;

	const mod = crypto.getRandomValues(new Uint8Array(size.bytes));
	mod[0] |= 0x80;

	const input = createModExpInput(sig, exp, mod);
	const result = execute(
		PrecompileAddress.MODEXP,
		input,
		10000000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
	}
}
// Fermat test: if p is prime and a < p, then a^(p-1) ≡ 1 (mod p)

const candidate = 97n; // Known prime
const base = 2n; // Test base
const exp = candidate - 1n; // p - 1

function bigIntToBytes(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array([0]);
	const hex = value.toString(16);
	const padded = hex.length % 2 === 0 ? hex : `0${hex}`;
	return new Uint8Array(
		padded.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)),
	);
}

const fermatInput = createModExpInput(
	bigIntToBytes(base),
	bigIntToBytes(exp),
	bigIntToBytes(candidate),
);

const fermatResult = execute(
	PrecompileAddress.MODEXP,
	fermatInput,
	100000n,
	Hardfork.CANCUN,
);

if (fermatResult.success) {
	const result = fermatResult.output[0];
}
// For prime p: a^(-1) ≡ a^(p-2) (mod p)

const a = 3n;
const p = 7n; // Prime modulus
const invExp = p - 2n; // p - 2

const invInput = createModExpInput(
	bigIntToBytes(a),
	bigIntToBytes(invExp),
	bigIntToBytes(p),
);

const invResult = execute(
	PrecompileAddress.MODEXP,
	invInput,
	100000n,
	Hardfork.CANCUN,
);

if (invResult.success) {
	const inverse = invResult.output[0];
	// Verify: 3 * inverse ≡ 1 (mod 7)
	const verify = (3n * BigInt(inverse)) % 7n;
}

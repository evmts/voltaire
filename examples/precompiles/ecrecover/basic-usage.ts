/**
 * ECRECOVER Precompile Basic Usage
 *
 * Address: 0x0000000000000000000000000000000000000001
 * Gas Cost: 3000 (fixed)
 *
 * Demonstrates:
 * - Recovering Ethereum address from signature
 * - Input format: hash(32) || v(32) || r(32) || s(32) = 128 bytes
 * - Output format: 32 bytes (12 zero padding + 20 byte address)
 * - Invalid signatures return zero address
 */

import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";

// Generate a keypair and sign a message
const privateKey = crypto.getRandomValues(new Uint8Array(32));
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Derive expected address from public key
const pubKeyHash = keccak256(publicKey);
const expectedAddress = pubKeyHash.slice(12); // Last 20 bytes

// Sign a message hash
const messageHash = keccak256(new TextEncoder().encode("Hello, ECRECOVER!"));

const signature = Secp256k1.sign(messageHash, privateKey);

// Prepare ECRECOVER input (128 bytes)
// Format: hash(32) || v(32, padded) || r(32) || s(32)
const input = new Uint8Array(128);
input.set(messageHash, 0);
input[63] = signature.v; // v in last byte of second 32-byte word
input.set(signature.r, 64);
input.set(signature.s, 96);

// Execute precompile
const result = execute(
	PrecompileAddress.ECRECOVER,
	input,
	10000n,
	Hardfork.CANCUN,
);

if (result.success) {
	// Extract address from output (last 20 bytes)
	const recoveredAddress = result.output.slice(12, 32);

	// Verify addresses match
	const match = recoveredAddress.every(
		(byte, i) => byte === expectedAddress[i],
	);
} else {
	console.error("Error:", result.error);
}
const invalidInput = new Uint8Array(128);
invalidInput.set(messageHash, 0);
invalidInput[63] = 27; // Valid v
// r and s are all zeros (invalid)

const invalidResult = execute(
	PrecompileAddress.ECRECOVER,
	invalidInput,
	10000n,
	Hardfork.CANCUN,
);

if (invalidResult.success) {
	const zeroAddress = invalidResult.output.every((byte) => byte === 0);
}
const oogResult = execute(
	PrecompileAddress.ECRECOVER,
	input,
	2000n, // Less than required 3000
	Hardfork.CANCUN,
);

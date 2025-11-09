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

import {
	execute,
	PrecompileAddress,
} from "../../../src/precompiles/precompiles.js";
import * as Hardfork from "../../../src/primitives/Hardfork/index.js";
import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";

console.log("=== ECRECOVER Basic Usage ===\n");

// Generate a keypair and sign a message
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Derive expected address from public key
const pubKeyHash = keccak256(publicKey);
const expectedAddress = pubKeyHash.slice(12); // Last 20 bytes

console.log(
	"Expected address:",
	"0x" + Buffer.from(expectedAddress).toString("hex"),
);

// Sign a message hash
const messageHash = keccak256(new TextEncoder().encode("Hello, ECRECOVER!"));
console.log("Message hash:", "0x" + Buffer.from(messageHash).toString("hex"));

const signature = Secp256k1.sign(messageHash, privateKey);
console.log("Signature v:", signature.v);

// Prepare ECRECOVER input (128 bytes)
// Format: hash(32) || v(32, padded) || r(32) || s(32)
const input = new Uint8Array(128);
input.set(messageHash, 0);
input[63] = signature.v; // v in last byte of second 32-byte word
input.set(signature.r, 64);
input.set(signature.s, 96);

console.log("\n=== Executing ECRECOVER ===");
console.log("Input length:", input.length, "bytes");

// Execute precompile
const result = execute(
	PrecompileAddress.ECRECOVER,
	input,
	10000n,
	Hardfork.CANCUN,
);

if (result.success) {
	console.log("\nResult: Success");
	console.log("Gas used:", result.gasUsed.toString()); // Always 3000

	// Extract address from output (last 20 bytes)
	const recoveredAddress = result.output.slice(12, 32);
	console.log(
		"Recovered address:",
		"0x" + Buffer.from(recoveredAddress).toString("hex"),
	);

	// Verify addresses match
	const match = recoveredAddress.every(
		(byte, i) => byte === expectedAddress[i],
	);
	console.log("Addresses match:", match ? "✓ Yes" : "✗ No");
} else {
	console.error("Error:", result.error);
}

// Example 2: Invalid signature (returns zero address)
console.log("\n=== Invalid Signature Test ===");
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
	console.log(
		"Invalid signature returns zero address:",
		zeroAddress ? "✓ Yes" : "✗ No",
	);
	console.log("Gas still consumed:", invalidResult.gasUsed.toString());
}

// Example 3: Out of gas
console.log("\n=== Out of Gas Test ===");
const oogResult = execute(
	PrecompileAddress.ECRECOVER,
	input,
	2000n, // Less than required 3000
	Hardfork.CANCUN,
);

console.log("Out of gas fails:", !oogResult.success ? "✓ Yes" : "✗ No");
console.log("Error:", oogResult.error);

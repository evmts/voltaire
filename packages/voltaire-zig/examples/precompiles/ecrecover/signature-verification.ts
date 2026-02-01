/**
 * ECRECOVER Signature Verification Example
 *
 * Demonstrates real-world signature verification patterns:
 * - Verifying signed messages (EIP-191 style)
 * - Checking multiple signatures efficiently
 * - Gas cost analysis for batch verification
 * - Handling signature malleability (EIP-2)
 */

import {
	BrandedPrivateKey as PrivateKey,
	Bytes,
	execute,
	Hardfork,
	Keccak256,
	PrecompileAddress,
	Secp256k1,
} from "@tevm/voltaire";

// Simulate a signed message scenario
const signerKey = PrivateKey.random();
const signerPubKey = Secp256k1.derivePublicKey(signerKey);
const signerAddress = Keccak256.hash(signerPubKey).slice(12);
const authMessage = "I authorize this action at timestamp 1234567890";
const authHash = Keccak256.hash(new TextEncoder().encode(authMessage));
const authSig = Secp256k1.sign(authHash, signerKey);

// Prepare ECRECOVER input
const authInput = Bytes.zero(128);
authInput.set(authHash, 0);
authInput[63] = authSig.v;
authInput.set(authSig.r, 64);
authInput.set(authSig.s, 96);

const authResult = execute(
	PrecompileAddress.ECRECOVER,
	authInput,
	10000n,
	Hardfork.CANCUN,
);

if (authResult.success) {
	const recoveredAddr = authResult.output.slice(12, 32);
	const isValid = recoveredAddr.every((byte, i) => byte === signerAddress[i]);
}
const messages = [
	"Transfer 100 tokens to Alice",
	"Transfer 50 tokens to Bob",
	"Update contract state",
];

let totalGas = 0n;
let validCount = 0;

for (const msg of messages) {
	const msgHash = Keccak256.hash(new TextEncoder().encode(msg));
	const sig = Secp256k1.sign(msgHash, signerKey);

	const input = Bytes.zero(128);
	input.set(msgHash, 0);
	input[63] = sig.v;
	input.set(sig.r, 64);
	input.set(sig.s, 96);

	const result = execute(
		PrecompileAddress.ECRECOVER,
		input,
		10000n,
		Hardfork.CANCUN,
	);

	if (result.success) {
		const recoveredAddr = result.output.slice(12, 32);
		const isValid = recoveredAddr.every((byte, i) => byte === signerAddress[i]);
		if (isValid) validCount++;
		totalGas += result.gasUsed;
	}
}

// Create a signature with s in the lower half (valid)
const testMessage = Keccak256.hash(new TextEncoder().encode("Test message"));
const validSig = Secp256k1.sign(testMessage, signerKey);

// secp256k1 curve order: n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
const secp256k1_n =
	0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const secp256k1_n_half = secp256k1_n / 2n;

// Check s value
const s_value = validSig.s.reduce(
	(acc, byte, i) => acc + (BigInt(byte) << BigInt(8 * (31 - i))),
	0n,
);

// Try with valid signature
const validInput = Bytes.zero(128);
validInput.set(testMessage, 0);
validInput[63] = validSig.v;
validInput.set(validSig.r, 64);
validInput.set(validSig.s, 96);

const validResult = execute(
	PrecompileAddress.ECRECOVER,
	validInput,
	10000n,
	Hardfork.CANCUN,
);

const validRecovered = validResult.output.slice(12, 32);
const validMatch = validRecovered.every((byte, i) => byte === signerAddress[i]);

// Create a different signer
const wrongKey = PrivateKey.random();
const wrongPubKey = Secp256k1.derivePublicKey(wrongKey);
const wrongAddress = Keccak256.hash(wrongPubKey).slice(12);

// Sign message with wrong key
const wrongSig = Secp256k1.sign(testMessage, wrongKey);

const wrongInput = Bytes.zero(128);
wrongInput.set(testMessage, 0);
wrongInput[63] = wrongSig.v;
wrongInput.set(wrongSig.r, 64);
wrongInput.set(wrongSig.s, 96);

const wrongResult = execute(
	PrecompileAddress.ECRECOVER,
	wrongInput,
	10000n,
	Hardfork.CANCUN,
);

const wrongRecovered = wrongResult.output.slice(12, 32);
const wrongMatch = wrongRecovered.every((byte, i) => byte === signerAddress[i]);

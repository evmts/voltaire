import {
	PrecompileAddress,
	execute,
} from "../../../src/precompiles/precompiles.js";
import { Hardfork } from "../../../src/primitives/Hardfork/index.js";

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
 * Simple hash function for demonstration
 * Real impl would use proper hash-to-field from RFC 9380
 */
function hashToFp2(message: Uint8Array): Uint8Array {
	const fp2 = new Uint8Array(128); // Two 64-byte field elements

	// Component 0 (bytes 0-63)
	for (let i = 0; i < 32; i++) {
		fp2[32 + i] = message[i % message.length] ^ (i * 7);
	}

	// Component 1 (bytes 64-127)
	for (let i = 0; i < 32; i++) {
		fp2[96 + i] = message[i % message.length] ^ (i * 13);
	}

	return fp2;
}

// BLS12-381 G1 generator (simplified coordinates)
// Real coordinates are much larger
const G1_GENERATOR = new Uint8Array(128);
// Set generator point bytes (simplified)
G1_GENERATOR[63] = 0x01; // x = 1
G1_GENERATOR[127] = 0x02; // y = 2

const secretKey = 12345678901234567890n;

// PK = sk × G1
const pkInput = new Uint8Array(160);
pkInput.set(G1_GENERATOR, 0); // G1 point (128 bytes)
pkInput.set(toBytes(secretKey, 32), 128); // Scalar (32 bytes)

const pkResult = execute(
	PrecompileAddress.BLS12_G1_MUL,
	pkInput,
	15000n,
	Hardfork.PRAGUE,
);

if (pkResult.success) {
	const publicKey = pkResult.output;

	const message = new TextEncoder().encode("Hello, BLS12-381!");

	// Hash to Fp2
	const fp2Element = hashToFp2(message);

	// Map Fp2 to G2
	const mapResult = execute(
		PrecompileAddress.BLS12_MAP_FP2_TO_G2,
		fp2Element,
		80000n,
		Hardfork.PRAGUE,
	);

	if (mapResult.success) {
		const messageHash = mapResult.output;

		// Signature = sk × H(m)
		const signInput = new Uint8Array(288);
		signInput.set(messageHash, 0); // G2 point (256 bytes)
		signInput.set(toBytes(secretKey, 32), 256); // Scalar (32 bytes)

		const signResult = execute(
			PrecompileAddress.BLS12_G2_MUL,
			signInput,
			50000n,
			Hardfork.PRAGUE,
		);

		if (signResult.success) {
			const signature = signResult.output;

			// Negate G1 generator (flip y-coordinate)
			const negG1 = new Uint8Array(G1_GENERATOR);
			// In real implementation, would flip y-coordinate
			// Simplified here

			// Build pairing input: 2 pairs (768 bytes)
			const pairingInput = new Uint8Array(768);

			// Pair 1: (PK, H(m))
			pairingInput.set(publicKey, 0); // G1 point (128 bytes)
			pairingInput.set(messageHash, 128); // G2 point (256 bytes)

			// Pair 2: (-G1, sig)
			pairingInput.set(negG1, 384); // G1 point (128 bytes)
			pairingInput.set(signature, 512); // G2 point (256 bytes)

			const verifyResult = execute(
				PrecompileAddress.BLS12_PAIRING,
				pairingInput,
				200000n,
				Hardfork.PRAGUE,
			);

			if (verifyResult.success) {
				const isValid = verifyResult.output[31] === 1;
			} else {
			}
			const totalGas =
				(pkResult.gasUsed || 0n) +
				(mapResult.gasUsed || 0n) +
				(signResult.gasUsed || 0n) +
				(verifyResult.gasUsed || 0n);
		}
	}
}

const NUM_VALIDATORS = 1000;

const N_PARTIES = 10;
const THRESHOLD = 7;

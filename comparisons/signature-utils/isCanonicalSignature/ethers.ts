import { Signature } from "ethers";
import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SECP256K1_N_HALF,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.ts";

// Ethers doesn't have a direct isCanonicalSignature method
// We need to implement it using Signature.from and comparing s value
function isCanonicalSignature(signature: string): boolean {
	try {
		const sig = Signature.from(signature);
		const s = BigInt(sig.s);
		return s <= SECP256K1_N_HALF;
	} catch {
		// If ethers rejects it, manually parse to check
		const normalized = signature.startsWith("0x")
			? signature.slice(2)
			: signature;
		if (normalized.length !== 130) return false;

		const sHex = `0x${normalized.slice(64, 128)}`;
		const s = BigInt(sHex);
		return s <= SECP256K1_N_HALF;
	}
}

export function main(): void {
	// Test canonical signature (should return true)
	isCanonicalSignature(CANONICAL_SIGNATURE_HEX);

	// Test non-canonical signature (should return false)
	isCanonicalSignature(NON_CANONICAL_SIGNATURE_HEX);

	// Test various v values
	isCanonicalSignature(SIGNATURE_V27_HEX);
	isCanonicalSignature(SIGNATURE_V28_HEX);
}

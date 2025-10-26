import { hexToSignature } from "viem";
import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
	SECP256K1_N_HALF,
} from "../test-data.ts";

// Viem doesn't have a direct isCanonicalSignature method
// We need to implement it manually since hexToSignature rejects invalid signatures
function isCanonicalSignature(signature: string): boolean {
	try {
		const sig = hexToSignature(signature as `0x${string}`);
		const s = BigInt(sig.s);
		return s <= SECP256K1_N_HALF;
	} catch {
		// If viem rejects it, it's either invalid or non-canonical
		// We'll manually parse to check if it's non-canonical
		const normalized = signature.startsWith("0x")
			? signature.slice(2)
			: signature;
		if (normalized.length !== 130) return false;

		const sHex = "0x" + normalized.slice(64, 128);
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

import { Signature } from "ethers";
import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.ts";

// Ethers Signature class has a serialized property that always returns canonical form
function normalizeSignature(signature: string): string {
	const sig = Signature.from(signature);
	return sig.serialized;
}

export function main(): void {
	// Test canonical signature (should return unchanged)
	normalizeSignature(CANONICAL_SIGNATURE_HEX);

	// Test non-canonical signature (should flip s value)
	normalizeSignature(NON_CANONICAL_SIGNATURE_HEX);

	// Test various v values
	normalizeSignature(SIGNATURE_V27_HEX);
	normalizeSignature(SIGNATURE_V28_HEX);
}

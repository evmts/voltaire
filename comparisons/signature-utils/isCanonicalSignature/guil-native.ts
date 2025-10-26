import { signatureIsCanonical } from "../../../src/typescript/native/primitives/signature.native.js";
import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.js";

function isCanonicalSignature(signature: string): boolean {
	const normalized = signature.startsWith("0x")
		? signature.slice(2)
		: signature;

	if (normalized.length !== 130) {
		throw new Error("Invalid signature length");
	}

	// Extract r and s components (32 bytes each)
	const rHex = normalized.slice(0, 64);
	const sHex = normalized.slice(64, 128);

	// Convert to Uint8Array
	const r = new Uint8Array(32);
	const s = new Uint8Array(32);

	for (let i = 0; i < 32; i++) {
		r[i] = Number.parseInt(rHex.slice(i * 2, i * 2 + 2), 16);
		s[i] = Number.parseInt(sHex.slice(i * 2, i * 2 + 2), 16);
	}

	return signatureIsCanonical(r, s);
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

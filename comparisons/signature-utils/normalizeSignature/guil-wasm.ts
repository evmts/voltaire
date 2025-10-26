import { signatureNormalize } from "../../../src/typescript/wasm/primitives/signature.wasm.js";
import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.js";

function normalizeSignature(signature: string): string {
	const normalized = signature.startsWith("0x")
		? signature.slice(2)
		: signature;

	if (normalized.length !== 130) {
		throw new Error("Invalid signature length");
	}

	// Extract r, s, and v components
	const rHex = normalized.slice(0, 64);
	const sHex = normalized.slice(64, 128);
	const vHex = normalized.slice(128, 130);

	// Convert to Uint8Array
	const r = new Uint8Array(32);
	const s = new Uint8Array(32);

	for (let i = 0; i < 32; i++) {
		r[i] = Number.parseInt(rHex.slice(i * 2, i * 2 + 2), 16);
		s[i] = Number.parseInt(sHex.slice(i * 2, i * 2 + 2), 16);
	}

	// Normalize r and s
	const [normalizedR, normalizedS] = signatureNormalize(r, s);

	// Convert back to hex
	const normalizedRHex = Array.from(normalizedR)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	const normalizedSHex = Array.from(normalizedS)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");

	// Note: signatureNormalize only normalizes r and s, not v
	// The v value flipping is handled by the caller if needed
	return `0x${normalizedRHex}${normalizedSHex}${vHex}`;
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

import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
	SECP256K1_N,
	SECP256K1_N_HALF,
} from "../test-data.ts";

// Implementation from src/crypto/signers/utils.ts
function parseSignature(signature: string | Uint8Array): {
	r: string;
	s: string;
	v: number;
	compact: string;
} {
	const bytes =
		typeof signature === "string" ? hexToBytes(signature) : signature;

	if (bytes.length !== 65) {
		throw new Error("Invalid signature length: expected 65 bytes");
	}

	const r = `0x${bytesToHex(bytes.slice(0, 32))}`;
	const s = `0x${bytesToHex(bytes.slice(32, 64))}`;
	const v = bytes[64]!;

	return {
		r,
		s,
		v,
		compact: `0x${bytesToHex(bytes)}`,
	};
}

function isCanonicalSignature(signature: string | Uint8Array): boolean {
	const sig = parseSignature(signature);
	const s = BigInt(sig.s);
	return s <= SECP256K1_N_HALF;
}

function normalizeSignature(signature: string | Uint8Array): string {
	const sig = parseSignature(signature);

	if (isCanonicalSignature(signature)) {
		return sig.compact;
	}

	// Flip s value: s' = n - s
	const s = BigInt(sig.s);
	const sNormalized = SECP256K1_N - s;

	// Flip recovery id
	const vNormalized = sig.v ^ 1;

	// Reconstruct signature
	const sHex = sNormalized.toString(16).padStart(64, "0");
	const vHex = vNormalized.toString(16).padStart(2, "0");

	return `0x${sig.r.slice(2)}${sHex}${vHex}`;
}

function hexToBytes(hex: string): Uint8Array {
	const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
	if (normalized.length % 2 !== 0) {
		throw new Error("Invalid hex string: odd length");
	}

	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
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

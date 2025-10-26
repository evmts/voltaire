import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
	SECP256K1_N_HALF,
} from "../test-data.js";

// Implementation from src/crypto/signers/utils.ts
function parseSignature(signature: string | Uint8Array): {
	r: string;
	s: string;
	v: number;
} {
	const bytes =
		typeof signature === "string" ? hexToBytes(signature) : signature;

	if (bytes.length !== 65) {
		throw new Error("Invalid signature length: expected 65 bytes");
	}

	const r = `0x${bytesToHex(bytes.slice(0, 32))}`;
	const s = `0x${bytesToHex(bytes.slice(32, 64))}`;
	const v = bytes[64]!;

	return { r, s, v };
}

function isCanonicalSignature(signature: string | Uint8Array): boolean {
	const sig = parseSignature(signature);
	const s = BigInt(sig.s);
	return s <= SECP256K1_N_HALF;
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
	// Test canonical signature (should return true)
	isCanonicalSignature(CANONICAL_SIGNATURE_HEX);

	// Test non-canonical signature (should return false)
	isCanonicalSignature(NON_CANONICAL_SIGNATURE_HEX);

	// Test various v values
	isCanonicalSignature(SIGNATURE_V27_HEX);
	isCanonicalSignature(SIGNATURE_V28_HEX);
}

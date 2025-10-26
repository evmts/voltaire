import {
	CANONICAL_SIGNATURE_HEX,
	CANONICAL_SIGNATURE_BYTES,
	SIGNATURE_V0_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.js";

// Implementation from src/crypto/signers/types.ts
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
	// Parse from hex string
	parseSignature(CANONICAL_SIGNATURE_HEX);
	parseSignature(SIGNATURE_V0_HEX);
	parseSignature(SIGNATURE_V27_HEX);
	parseSignature(SIGNATURE_V28_HEX);

	// Parse from Uint8Array
	parseSignature(CANONICAL_SIGNATURE_BYTES);
}

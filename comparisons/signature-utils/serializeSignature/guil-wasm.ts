import {
	SIGNATURE_R_HEX,
	SIGNATURE_S_HEX,
	SIGNATURE_R_BYTES,
	SIGNATURE_S_BYTES,
	SIGNATURE_V,
} from "../test-data.js";

// Implementation from src/crypto/signers/types.ts
function serializeSignature(
	r: string | Uint8Array,
	s: string | Uint8Array,
	v: number,
): string {
	const rBytes = typeof r === "string" ? hexToBytes(r) : r;
	const sBytes = typeof s === "string" ? hexToBytes(s) : s;

	if (rBytes.length !== 32 || sBytes.length !== 32) {
		throw new Error(
			"Invalid signature component length: r and s must be 32 bytes",
		);
	}

	const signature = new Uint8Array(65);
	signature.set(rBytes, 0);
	signature.set(sBytes, 32);
	signature[64] = v;

	return `0x${bytesToHex(signature)}`;
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
	// Serialize from hex strings
	serializeSignature(SIGNATURE_R_HEX, SIGNATURE_S_HEX, SIGNATURE_V);
	serializeSignature(SIGNATURE_R_HEX, SIGNATURE_S_HEX, 0);
	serializeSignature(SIGNATURE_R_HEX, SIGNATURE_S_HEX, 1);
	serializeSignature(SIGNATURE_R_HEX, SIGNATURE_S_HEX, 28);

	// Serialize from Uint8Array
	serializeSignature(SIGNATURE_R_BYTES, SIGNATURE_S_BYTES, SIGNATURE_V);
}

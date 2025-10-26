import { signatureSerialize } from "../../../src/typescript/native/primitives/signature.native.js";
import {
	SIGNATURE_R_BYTES,
	SIGNATURE_R_HEX,
	SIGNATURE_S_BYTES,
	SIGNATURE_S_HEX,
	SIGNATURE_V,
} from "../test-data.js";

function serializeSignature(
	r: string | Uint8Array,
	s: string | Uint8Array,
	v: number,
): string {
	let rBytes: Uint8Array;
	let sBytes: Uint8Array;

	if (typeof r === "string") {
		const normalized = r.startsWith("0x") ? r.slice(2) : r;
		rBytes = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			rBytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		}
	} else {
		rBytes = r;
	}

	if (typeof s === "string") {
		const normalized = s.startsWith("0x") ? s.slice(2) : s;
		sBytes = new Uint8Array(32);
		for (let i = 0; i < 32; i++) {
			sBytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		}
	} else {
		sBytes = s;
	}

	const serialized = signatureSerialize(rBytes, sBytes, v, true);

	return `0x${Array.from(serialized)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
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

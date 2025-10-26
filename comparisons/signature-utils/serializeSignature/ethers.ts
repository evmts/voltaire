import { Signature } from "ethers";
import {
	SIGNATURE_R_BYTES,
	SIGNATURE_R_HEX,
	SIGNATURE_S_BYTES,
	SIGNATURE_S_HEX,
	SIGNATURE_V,
} from "../test-data.ts";

// Ethers uses Signature.from with object notation
function serializeSignature(
	r: string | Uint8Array,
	s: string | Uint8Array,
	v: number,
): string {
	const rHex =
		typeof r === "string"
			? r
			: `0x${Array.from(r)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;
	const sHex =
		typeof s === "string"
			? s
			: `0x${Array.from(s)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("")}`;

	const sig = Signature.from({
		r: rHex,
		s: sHex,
		v: v,
	});

	return sig.serialized;
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

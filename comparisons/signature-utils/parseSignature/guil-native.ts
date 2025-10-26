import { signatureParse } from "../../../src/typescript/native/primitives/signature.native.js";
import {
	CANONICAL_SIGNATURE_HEX,
	CANONICAL_SIGNATURE_BYTES,
	SIGNATURE_V0_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.js";

function parseSignature(signature: string | Uint8Array): {
	r: string;
	s: string;
	v: number;
} {
	let bytes: Uint8Array;

	if (typeof signature === "string") {
		const normalized = signature.startsWith("0x")
			? signature.slice(2)
			: signature;

		if (normalized.length !== 130) {
			throw new Error("Invalid signature length");
		}

		bytes = new Uint8Array(65);
		for (let i = 0; i < 65; i++) {
			bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
		}
	} else {
		bytes = signature;
	}

	const parsed = signatureParse(bytes);

	// Convert r and s to hex strings
	const r =
		"0x" +
		Array.from(parsed.r)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	const s =
		"0x" +
		Array.from(parsed.s)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

	return {
		r,
		s,
		v: parsed.v,
	};
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

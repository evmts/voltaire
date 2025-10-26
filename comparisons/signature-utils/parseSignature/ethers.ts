import { Signature } from "ethers";
import {
	CANONICAL_SIGNATURE_BYTES,
	CANONICAL_SIGNATURE_HEX,
	SIGNATURE_V0_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.ts";

// Ethers uses Signature.from to parse signatures
function parseSignature(signature: string | Uint8Array): {
	r: string;
	s: string;
	v: number;
} {
	try {
		// Ethers expects specific formats, convert Uint8Array to hex
		let input: string;
		if (typeof signature === "string") {
			input = signature;
		} else {
			input = `0x${Array.from(signature)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
		}

		const sig = Signature.from(input);
		return {
			r: sig.r,
			s: sig.s,
			v: sig.v,
		};
	} catch {
		// Manual parsing if ethers rejects it
		let hex: string;
		if (typeof signature === "string") {
			hex = signature;
		} else {
			hex = `0x${Array.from(signature)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
		}

		const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
		if (normalized.length !== 130) throw new Error("Invalid signature length");

		const r = `0x${normalized.slice(0, 64)}`;
		const s = `0x${normalized.slice(64, 128)}`;
		const v = Number.parseInt(normalized.slice(128, 130), 16);

		return { r, s, v };
	}
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

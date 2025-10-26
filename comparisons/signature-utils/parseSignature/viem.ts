import { hexToSignature, bytesToHex } from "viem";
import {
	CANONICAL_SIGNATURE_HEX,
	CANONICAL_SIGNATURE_BYTES,
	SIGNATURE_V0_HEX,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.ts";

// Viem uses hexToSignature to parse signatures
function parseSignature(signature: string | Uint8Array): {
	r: string;
	s: string;
	v: number;
} {
	let hex: string;
	if (typeof signature === "string") {
		hex = signature;
	} else {
		// Convert Uint8Array to hex manually
		hex =
			"0x" +
			Array.from(signature)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
	}

	try {
		const sig = hexToSignature(hex as `0x${string}`);
		// Convert to compatible format
		return {
			r: sig.r,
			s: sig.s,
			v: typeof sig.v === "bigint" ? Number(sig.v) : sig.yParity + 27,
		};
	} catch {
		// Manual parsing if viem rejects it
		const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
		if (normalized.length !== 130) throw new Error("Invalid signature length");

		const r = "0x" + normalized.slice(0, 64);
		const s = "0x" + normalized.slice(64, 128);
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

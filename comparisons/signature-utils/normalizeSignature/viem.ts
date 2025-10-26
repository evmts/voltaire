import { hexToSignature, signatureToHex } from "viem";
import {
	CANONICAL_SIGNATURE_HEX,
	NON_CANONICAL_SIGNATURE_HEX,
	SECP256K1_N,
	SECP256K1_N_HALF,
	SIGNATURE_V27_HEX,
	SIGNATURE_V28_HEX,
} from "../test-data.ts";

// Viem doesn't have a direct normalizeSignature method
// We need to implement it manually
function normalizeSignature(signature: string): string {
	try {
		const sig = hexToSignature(signature as `0x${string}`);
		const s = BigInt(sig.s);

		// If already canonical, return as-is
		if (s <= SECP256K1_N_HALF) {
			return signatureToHex(sig);
		}

		// Flip s value: s' = n - s
		const sNormalized = SECP256K1_N - s;

		// Flip recovery id
		const vNormalized = sig.yParity === 0 ? 1 : 0;

		return signatureToHex({
			r: sig.r,
			s: `0x${sNormalized.toString(16).padStart(64, "0")}` as `0x${string}`,
			yParity: vNormalized,
		});
	} catch {
		// If viem rejects it (non-canonical), manually normalize
		const normalized = signature.startsWith("0x")
			? signature.slice(2)
			: signature;
		if (normalized.length !== 130) return signature;

		const rHex = `0x${normalized.slice(0, 64)}`;
		const sHex = `0x${normalized.slice(64, 128)}`;
		const vByte = Number.parseInt(normalized.slice(128, 130), 16);

		const s = BigInt(sHex);

		// If already canonical, return as-is
		if (s <= SECP256K1_N_HALF) {
			return signature;
		}

		// Flip s value
		const sNormalized = SECP256K1_N - s;

		// Flip recovery id
		const vNormalized = vByte ^ 1;

		const sHexNorm = sNormalized.toString(16).padStart(64, "0");
		const vHexNorm = vNormalized.toString(16).padStart(2, "0");

		return `0x${rHex.slice(2)}${sHexNorm}${vHexNorm}`;
	}
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

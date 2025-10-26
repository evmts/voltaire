/**
 * Test data for signature utility benchmarks
 *
 * Includes various signature formats and edge cases:
 * - Canonical signatures (s <= n/2)
 * - Non-canonical signatures (s > n/2, malleable)
 * - Different v values (0, 1, 27, 28)
 */

// secp256k1 curve order
export const SECP256K1_N = BigInt(
	"0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
);
export const SECP256K1_N_HALF = SECP256K1_N / 2n;

/**
 * Canonical signature - s value is low (s <= n/2)
 * This is a valid, non-malleable signature
 */
export const CANONICAL_SIGNATURE_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c0007f8e9d0c1b2a3f4e5d6c7b8a9e0f1d2c3b4a5e6f7e8d9e0a1b2c3d4e5f6e71b";
export const CANONICAL_SIGNATURE_BYTES = hexToBytes(CANONICAL_SIGNATURE_HEX);

/**
 * Non-canonical signature - s value is high (s > n/2)
 * This signature is malleable and should be normalized
 * s = n/2 + 100 = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b2104
 */
export const NON_CANONICAL_SIGNATURE_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b21041b";
export const NON_CANONICAL_SIGNATURE_BYTES = hexToBytes(
	NON_CANONICAL_SIGNATURE_HEX,
);

/**
 * Signature with v=0 (compact format)
 */
export const SIGNATURE_V0_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c0007f8e9d0c1b2a3f4e5d6c7b8a9e0f1d2c3b4a5e6f7e8d9e0a1b2c3d4e5f6e700";
export const SIGNATURE_V0_BYTES = hexToBytes(SIGNATURE_V0_HEX);

/**
 * Signature with v=1 (compact format)
 */
export const SIGNATURE_V1_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c0007f8e9d0c1b2a3f4e5d6c7b8a9e0f1d2c3b4a5e6f7e8d9e0a1b2c3d4e5f6e701";
export const SIGNATURE_V1_BYTES = hexToBytes(SIGNATURE_V1_HEX);

/**
 * Signature with v=27 (legacy format)
 */
export const SIGNATURE_V27_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c0007f8e9d0c1b2a3f4e5d6c7b8a9e0f1d2c3b4a5e6f7e8d9e0a1b2c3d4e5f6e71b";
export const SIGNATURE_V27_BYTES = hexToBytes(SIGNATURE_V27_HEX);

/**
 * Signature with v=28 (legacy format)
 */
export const SIGNATURE_V28_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c0007f8e9d0c1b2a3f4e5d6c7b8a9e0f1d2c3b4a5e6f7e8d9e0a1b2c3d4e5f6e71c";
export const SIGNATURE_V28_BYTES = hexToBytes(SIGNATURE_V28_HEX);

/**
 * Signature components for serialization tests
 */
export const SIGNATURE_R_HEX =
	"0x7e9f6d4c8b3a2e5f1d8c9b4a6e3f2d1c8b7a5e4d3c2b1a9e8d7c6b5a4f3e2d1c";
export const SIGNATURE_S_HEX =
	"0x0007f8e9d0c1b2a3f4e5d6c7b8a9e0f1d2c3b4a5e6f7e8d9e0a1b2c3d4e5f6e7";
export const SIGNATURE_V = 27;

export const SIGNATURE_R_BYTES = hexToBytes(SIGNATURE_R_HEX);
export const SIGNATURE_S_BYTES = hexToBytes(SIGNATURE_S_HEX);

// Helper function
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

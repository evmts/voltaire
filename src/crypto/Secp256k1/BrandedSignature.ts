/**
 * ECDSA signature with Ethereum-compatible v value
 *
 * Components:
 * - r: x-coordinate of the ephemeral public key (32 bytes)
 * - s: signature proof value (32 bytes)
 * - v: recovery id (27 or 28 for Ethereum)
 */
export interface BrandedSignature {
	r: Uint8Array;
	s: Uint8Array;
	v: number;
}

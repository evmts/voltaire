import type { Any } from "./types.js";

/**
 * Return new transaction with updated nonce
 * @param this Transaction
 * @param nonce New nonce value
 * @returns New transaction with updated nonce
 */
export function withNonce(this: Any, nonce: bigint): Any {
	return { ...this, nonce };
}

import * as Uint from "../Uint/index.js";

/**
 * Create Nonce from number, bigint, or hex string
 *
 * @param value - Value to convert
 * @returns Nonce
 *
 * @example
 * ```typescript
 * const nonce1 = Nonce.from(0);
 * const nonce2 = Nonce.from(42n);
 * const nonce3 = Nonce.from("0x2a");
 * ```
 */
export function from(value) {
	return Uint.from(value);
}

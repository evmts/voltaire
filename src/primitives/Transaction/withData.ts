import type { Any } from "./types.js";

/**
 * Return new transaction with updated data
 * @param this Transaction
 * @param data New data value
 * @returns New transaction with updated data
 */
export function withData(this: Any, data: Uint8Array): Any {
	return { ...this, data };
}

import * as Hex from "../Hex/index.js";

/**
 * Convert RevertReason to string representation
 *
 * @param {import('./RevertReasonType.js').RevertReasonType} reason - Revert reason
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const str = RevertReason.toString(reason);
 * // "Error: Insufficient balance"
 * // "Panic(0x11): Arithmetic overflow/underflow"
 * ```
 */
export function toString(reason) {
	switch (reason.type) {
		case "Error":
			return `Error: ${reason.message}`;
		case "Panic":
			return `Panic(0x${reason.code.toString(16)}): ${reason.description}`;
		case "Custom":
			return `Custom error: ${reason.selector} (${reason.data.length} bytes data)`;
		case "Unknown":
			return `Unknown revert: ${Hex.fromBytes(reason.data)}`;
		default:
			return "Unknown revert";
	}
}

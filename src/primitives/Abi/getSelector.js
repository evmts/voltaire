import { keccak256String } from "../Hash/BrandedHash/keccak256String.js";
import * as Hex from "../Hex/index.js";

/**
 * Get function/event/error selector from signature string
 * Computes first 4 bytes of keccak256 hash for functions/errors
 * Computes full 32 bytes of keccak256 hash for events
 *
 * @param {string} signature - Function/event/error signature (e.g., "transfer(address,uint256)")
 * @param {{ type?: "function" | "event" | "error" }} [options] - Options
 * @returns {import("../Hex/BrandedHex/BrandedHex.js").BrandedHex} Selector (4 bytes for function/error, 32 bytes for event)
 *
 * @example
 * ```typescript
 * // Function selector (4 bytes)
 * const selector = Abi.getSelector("transfer(address,uint256)");
 * // "0xa9059cbb"
 *
 * // Event selector (32 bytes - full hash used as topic0)
 * const eventSelector = Abi.getSelector("Transfer(address,address,uint256)", { type: "event" });
 * // "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
 * ```
 */
export function getSelector(signature, options = {}) {
	const hash = keccak256String(signature);

	// Events use full 32-byte hash as topic0
	if (options.type === "event") {
		return Hex.fromBytes(hash);
	}

	// Functions and errors use first 4 bytes
	return Hex.fromBytes(hash.slice(0, 4));
}

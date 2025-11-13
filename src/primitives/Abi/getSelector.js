import * as Hex from "../Hex/index.js";

/**
 * Factory: Get function/event/error selector from signature string
 * @param {Object} deps - Crypto dependencies
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(signature: string, options?: { type?: "function" | "event" | "error" }) => import("../Hex/BrandedHex/BrandedHex.js").BrandedHex} Function that computes selector from signature
 *
 * @example
 * ```typescript
 * import { GetSelector } from './primitives/Abi/index.js';
 * import { keccak256String } from './primitives/Hash/index.js';
 *
 * const getSelector = GetSelector({ keccak256String });
 * const selector = getSelector("transfer(address,uint256)");
 * ```
 */
export function GetSelector({ keccak256String }) {
	return function getSelector(signature, options = {}) {
		const hash = keccak256String(signature);

		// Events use full 32-byte hash as topic0
		if (options.type === "event") {
			return Hex.fromBytes(hash);
		}

		// Functions and errors use first 4 bytes
		return Hex.fromBytes(hash.slice(0, 4));
	};
}

import { keccak256String } from "../../../Hash/BrandedHash/keccak256String.js";
import { getSignature } from "./getSignature.js";

/**
 * Get event selector (keccak256 hash of signature)
 *
 * @param {import('./BrandedEvent.js').Event} event - Event definition
 * @returns {import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash} Event selector (32 bytes)
 *
 * @example
 * ```typescript
 * const event = { type: "event", name: "Transfer", inputs: [...] };
 * const selector = Event.getSelector(event);
 * ```
 */
export function getSelector(event) {
	const signature = getSignature(event);
	return keccak256String(signature);
}

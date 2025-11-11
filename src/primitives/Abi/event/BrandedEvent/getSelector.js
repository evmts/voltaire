import { keccak256String } from "../../../Hash/BrandedHash/keccak256String.js";
import { getSignature } from "./getSignature.js";

/**
 * Get event selector (keccak256 hash of signature)
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./BrandedEvent.js').Event} event - Event definition
 * @returns {import('../../../Hash/BrandedHash/BrandedHash.js').BrandedHash} Event selector (32 bytes)
 * @throws {never}
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const event = { type: "event", name: "Transfer", inputs: [{ type: "address", indexed: true }] };
 * const selector = Abi.Event.getSelector(event);
 * ```
 */
export function getSelector(event) {
	const signature = getSignature(event);
	return keccak256String(signature);
}

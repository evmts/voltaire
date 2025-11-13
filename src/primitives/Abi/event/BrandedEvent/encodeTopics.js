import { encodeValue, isDynamicType } from "../../Encoding.js";
import { GetSelector } from "./getSelector.js";

/**
 * Factory: Encode event arguments into topics array
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function
 * @param {(str: string) => Uint8Array} deps.keccak256String - Keccak256 hash function for strings
 * @returns {(event: any, args: any) => (import('../../../Hash/BrandedHash/BrandedHash.js').BrandedHash | null)[]} Function that encodes event topics
 *
 * @example
 * ```typescript
 * import { EncodeTopics } from './primitives/Abi/event/index.js';
 * import { hash as keccak256, keccak256String } from './primitives/Hash/index.js';
 *
 * const encodeTopics = EncodeTopics({ keccak256, keccak256String });
 * const event = { type: "event", name: "Transfer", inputs: [...], anonymous: false };
 * const topics = encodeTopics(event, { from: "0x...", to: "0x..." });
 * // [selector, encodedFrom, encodedTo]
 * ```
 */
export function EncodeTopics({ keccak256, keccak256String }) {
	const getSelector = GetSelector({ keccak256String });

	/**
	 * Encode event arguments into topics array
	 *
	 * @param {import('./BrandedEvent.js').Event} event - Event definition
	 * @param {import('./BrandedEvent.js').EncodeTopicsArgs<any>} args - Event arguments to encode
	 * @returns {(import('../../../Hash/BrandedHash/BrandedHash.js').BrandedHash | null)[]} Topics array (nulls for unspecified indexed params)
	 */
	return function encodeTopics(event, args) {
		const topics = [];

		if (!event.anonymous) {
			topics.push(getSelector(event));
		}

		for (const param of event.inputs) {
			if (!param.indexed) continue;

			const value = param.name ? args[param.name] : undefined;
			if (value === undefined || value === null) {
				topics.push(null);
				continue;
			}

			if (isDynamicType(param.type)) {
				const { encoded } = encodeValue(param.type, value);
				topics.push(keccak256(encoded));
			} else {
				const { encoded } = encodeValue(param.type, value);
				topics.push(encoded);
			}
		}

		return /** @type {(import('../../../Hash/BrandedHash/BrandedHash.js').BrandedHash | null)[]} */ (
			topics
		);
	};
}

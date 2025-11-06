import { keccak256 } from "../../Hash/BrandedHash/keccak256.js";
import { encodeValue, isDynamicType } from "../Encoding.js";
import { getSelector } from "./getSelector.js";

/**
 * Encode event arguments into topics array
 *
 * @param {import('./BrandedEvent.js').Event} event - Event definition
 * @param {import('./BrandedEvent.js').EncodeTopicsArgs<any>} args - Event arguments to encode
 * @returns {(import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash | null)[]} Topics array (nulls for unspecified indexed params)
 *
 * @example
 * ```typescript
 * const event = { type: "event", name: "Transfer", inputs: [...], anonymous: false };
 * const topics = Event.encodeTopics(event, { from: "0x...", to: "0x..." });
 * // [selector, encodedFrom, encodedTo]
 * ```
 */
export function encodeTopics(event, args) {
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

	return /** @type {(import('../../Hash/BrandedHash/BrandedHash.js').BrandedHash | null)[]} */ (
		topics
	);
}

import {
	decodeParameters,
	decodeValue,
	isDynamicType,
} from "../../Encoding.js";
import { AbiDecodingError, AbiInvalidSelectorError } from "../../Errors.js";
import { getSelector } from "./getSelector.js";

/**
 * Decode event log data and topics into event arguments
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {import('./BrandedEvent.js').Event} event - Event definition
 * @param {Uint8Array} data - Log data bytes
 * @param {readonly import('../../../Hash/index.js').BrandedHash[]} topics - Log topics
 * @returns {import('./BrandedEvent.js').DecodeLogResult<any>} Decoded event arguments
 * @throws {AbiDecodingError} If topics are missing or invalid
 * @throws {AbiInvalidSelectorError} If event selector doesn't match topic0
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 * const event = { type: "event", name: "Transfer", inputs: [
 *   { type: "address", name: "from", indexed: true },
 *   { type: "address", name: "to", indexed: true },
 *   { type: "uint256", name: "value" }
 * ]};
 * const decoded = Abi.Event.decodeLog(event, logData, logTopics);
 * // { from: "0x...", to: "0x...", value: 1000n }
 * ```
 */
export function decodeLog(event, data, topics) {
	let topicIndex = 0;

	if (!event.anonymous) {
		if (topics.length === 0) {
			throw new AbiDecodingError("Missing topic0 for non-anonymous event", {
				context: { eventName: event.name, anonymous: event.anonymous }
			});
		}
		const topic0 = topics[0];
		if (!topic0) {
			throw new AbiDecodingError("Missing topic0 for non-anonymous event", {
				context: { eventName: event.name, anonymous: event.anonymous }
			});
		}
		const expectedSelector = getSelector(event);
		for (let i = 0; i < 32; i++) {
			const t0Byte = topic0[i];
			const expByte = expectedSelector[i];
			if (t0Byte !== expByte) {
				throw new AbiInvalidSelectorError("Event selector mismatch", {
					value: topic0,
					expected: expectedSelector,
					context: { topic0, expectedSelector, eventName: event.name }
				});
			}
		}
		topicIndex = 1;
	}

	/** @type {Record<string, any>} */
	const result = {};
	const nonIndexedParams = [];

	for (const param of event.inputs) {
		if (param.indexed) {
			if (topicIndex >= topics.length) {
				throw new AbiDecodingError(
					`Missing topic for indexed parameter ${param.name}`,
					{
						context: { parameterName: param.name, topicIndex, topicsLength: topics.length, eventName: event.name }
					}
				);
			}
			const topic = topics[topicIndex++];
			if (!topic) {
				throw new AbiDecodingError(
					`Missing topic for indexed parameter ${param.name}`,
					{
						context: { parameterName: param.name, topicIndex: topicIndex - 1, eventName: event.name }
					}
				);
			}

			if (isDynamicType(param.type)) {
				if (param.name) {
					result[param.name] = topic;
				}
			} else {
				const { value } = decodeValue(param.type, topic, 0);
				if (param.name) {
					result[param.name] = value;
				}
			}
		} else {
			nonIndexedParams.push(param);
		}
	}

	if (nonIndexedParams.length > 0) {
		const decoded = decodeParameters(nonIndexedParams, data);
		for (let i = 0; i < nonIndexedParams.length; i++) {
			const param = nonIndexedParams[i];
			if (param?.name) {
				result[param.name] = decoded[i];
			}
		}
	}

	return result;
}

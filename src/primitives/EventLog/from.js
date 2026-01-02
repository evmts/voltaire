/**
 * @typedef {import('./EventLogType.js').EventLogType} BrandedEventLog
 */

import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";
import { create } from "./create.js";

const HASH_SIZE = 32;

/**
 * Validate a topic is a valid 32-byte hash
 *
 * @param {unknown} topic - Topic to validate
 * @param {number} index - Topic index for error messages
 * @throws {InvalidLengthError} If topic is wrong length
 * @throws {InvalidFormatError} If topic is invalid format
 */
function validateTopic(topic, index) {
	if (topic instanceof Uint8Array) {
		if (topic.length !== HASH_SIZE) {
			throw new InvalidLengthError(
				`Topic at index ${index} must be ${HASH_SIZE} bytes, got ${topic.length}`,
				{
					code: "EVENTLOG_INVALID_TOPIC_LENGTH",
					value: topic,
					expected: `${HASH_SIZE} bytes`,
					context: { index, actualLength: topic.length },
					docsPath: "/primitives/eventlog",
				},
			);
		}
		return;
	}
	if (typeof topic === "string") {
		const normalized = topic.startsWith("0x") ? topic.slice(2) : topic;
		if (normalized.length !== HASH_SIZE * 2) {
			throw new InvalidLengthError(
				`Topic at index ${index} must be ${HASH_SIZE * 2} hex characters, got ${normalized.length}`,
				{
					code: "EVENTLOG_INVALID_TOPIC_LENGTH",
					value: topic,
					expected: `${HASH_SIZE * 2} hex characters`,
					context: { index, actualLength: normalized.length },
					docsPath: "/primitives/eventlog",
				},
			);
		}
		if (!/^[0-9a-fA-F]+$/.test(normalized)) {
			throw new InvalidFormatError(
				`Topic at index ${index} contains invalid hex characters`,
				{
					code: "EVENTLOG_INVALID_TOPIC_FORMAT",
					value: topic,
					expected: "hexadecimal string",
					context: { index },
					docsPath: "/primitives/eventlog",
				},
			);
		}
		return;
	}
	throw new InvalidFormatError(
		`Topic at index ${index} must be a Uint8Array or hex string`,
		{
			code: "EVENTLOG_INVALID_TOPIC_TYPE",
			value: topic,
			expected: "Uint8Array or hex string",
			context: { index, actualType: typeof topic },
			docsPath: "/primitives/eventlog",
		},
	);
}

/**
 * Create EventLog from parameters
 *
 * @see https://voltaire.tevm.sh/primitives/eventlog for EventLog documentation
 * @since 0.0.0
 * @param {Parameters<typeof create>[0]} params - Event log parameters
 * @returns {BrandedEventLog}
 * @throws {InvalidLengthError} If any topic is wrong length
 * @throws {InvalidFormatError} If any topic has invalid format
 * @example
 * ```javascript
 * import * as EventLog from './primitives/EventLog/index.js';
 * import * as Address from './primitives/Address/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 * const log = EventLog.from({
 *   address: Address.from("0x..."),
 *   topics: [Hash.from("0x...")],
 *   data: new Uint8Array([1, 2, 3]),
 * });
 * ```
 */
export function from(params) {
	// Validate topics
	if (params.topics) {
		for (let i = 0; i < params.topics.length; i++) {
			validateTopic(params.topics[i], i);
		}
	}
	return create(params);
}

import { InvalidTopicFilterError } from "./errors.js";

/**
 * Create TopicFilter from array
 *
 * @param {readonly [import('./TopicFilterType.js').TopicEntry?, import('./TopicFilterType.js').TopicEntry?, import('./TopicFilterType.js').TopicEntry?, import('./TopicFilterType.js').TopicEntry?]} topics - Topic filter array (up to 4 entries)
 * @returns {import('./TopicFilterType.js').TopicFilterType}
 * @throws {InvalidTopicFilterError}
 * @example
 * ```javascript
 * import * as TopicFilter from './primitives/TopicFilter/index.js';
 * import * as Hash from './primitives/Hash/index.js';
 *
 * // Match specific event signature with any parameters
 * const filter1 = TopicFilter.from([Hash.from("0x...")]);
 *
 * // Match specific event with specific recipient
 * const filter2 = TopicFilter.from([eventSig, null, recipientHash]);
 *
 * // Match any of multiple events
 * const filter3 = TopicFilter.from([[eventSig1, eventSig2]]);
 * ```
 */
export function from(topics) {
	if (!Array.isArray(topics)) {
		throw new InvalidTopicFilterError("TopicFilter must be an array", {
			value: topics,
			expected: "array",
		});
	}

	if (topics.length > 4) {
		throw new InvalidTopicFilterError(
			"TopicFilter cannot have more than 4 entries",
			{
				value: topics,
				expected: "array with <= 4 entries",
				context: { actualLength: topics.length },
			},
		);
	}

	// Validate each entry
	for (let i = 0; i < topics.length; i++) {
		const entry = topics[i];
		if (entry === null || entry === undefined) {
			continue;
		}

		if (Array.isArray(entry)) {
			// Validate array of hashes
			if (entry.length === 0) {
				throw new InvalidTopicFilterError(
					`Topic entry at index ${i} cannot be an empty array`,
					{
						value: entry,
						expected: "non-empty array or Hash or null",
						context: { index: i },
					},
				);
			}
			for (const hash of entry) {
				if (!(hash instanceof Uint8Array) || hash.length !== 32) {
					throw new InvalidTopicFilterError(
						`Topic entry at index ${i} must contain valid Hash values`,
						{
							value: hash,
							expected: "Hash (32-byte Uint8Array)",
							context: { index: i },
						},
					);
				}
			}
		} else if (!(entry instanceof Uint8Array) || entry.length !== 32) {
			throw new InvalidTopicFilterError(
				`Topic entry at index ${i} must be Hash, Hash[], or null`,
				{
					value: entry,
					expected: "Hash (32-byte Uint8Array), Hash[], or null",
					context: { index: i },
				},
			);
		}
	}

	return /** @type {import('./TopicFilterType.js').TopicFilterType} */ (topics);
}

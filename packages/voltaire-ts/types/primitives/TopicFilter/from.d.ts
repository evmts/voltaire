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
export function from(topics: readonly [import("./TopicFilterType.js").TopicEntry?, import("./TopicFilterType.js").TopicEntry?, import("./TopicFilterType.js").TopicEntry?, import("./TopicFilterType.js").TopicEntry?]): import("./TopicFilterType.js").TopicFilterType;
//# sourceMappingURL=from.d.ts.map
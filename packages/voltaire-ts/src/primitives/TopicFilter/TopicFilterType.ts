import type { brand } from "../../brand.js";
import type { HashType } from "../Hash/HashType.js";

/**
 * Single topic filter entry - either a specific hash, array of hashes (OR), or null (wildcard)
 */
export type TopicEntry = HashType | readonly HashType[] | null;

/**
 * Topic filter array for event filtering
 *
 * - Up to 4 indexed event parameters (topic0, topic1, topic2, topic3)
 * - topic0 is typically the event signature hash
 * - null entries match any value (wildcard)
 * - Array entries match any of the values (OR logic)
 * - Positions use AND logic: all non-null positions must match
 *
 * @example
 * ```typescript
 * // Match specific event with any sender
 * [eventSig, null, recipientAddr]
 *
 * // Match any of multiple events
 * [[eventSig1, eventSig2], null, null]
 *
 * // Match specific sender OR specific recipient
 * [eventSig, [addr1, addr2], null]
 * ```
 */
export type TopicFilterType = readonly [
	TopicEntry?,
	TopicEntry?,
	TopicEntry?,
	TopicEntry?,
] & {
	readonly [brand]: "TopicFilter";
};

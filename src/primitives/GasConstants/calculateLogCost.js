import { LogBase, LogData, LogTopic } from "./constants.js";

/**
 * Calculate LOG gas cost
 *
 * @param {bigint} topicCount - Number of topics (0-4)
 * @param {bigint} dataSize - Size of log data in bytes
 * @returns {bigint} Total gas cost
 *
 * @example
 * ```typescript
 * const cost = calculateLogCost(2n, 64n); // LOG2 with 64 bytes
 * // 375 + (2 * 375) + (64 * 8) = 1637 gas
 * ```
 */
export function calculateLogCost(topicCount, dataSize) {
	return LogBase + topicCount * LogTopic + dataSize * LogData;
}

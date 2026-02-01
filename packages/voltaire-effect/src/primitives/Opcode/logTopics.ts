/**
 * @module logTopics
 * @description Get number of topics for LOG opcode (pure)
 * @since 0.1.0
 */
import { Opcode } from "@tevm/voltaire/Opcode";

/**
 * Get the number of topics for a LOG opcode
 *
 * @param opcode - LOG opcode (0xa0-0xa4)
 * @returns Number of topics (0-4), or -1 if not a LOG
 */
export const logTopics = Opcode.logTopics;
export const _logTopics = logTopics;

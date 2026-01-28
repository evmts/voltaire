/**
 * @module allIds
 * @description Get all hardfork IDs (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";

/**
 * Get all hardfork IDs in order
 *
 * @returns Array of all hardfork types in chronological order
 */
export const allIds = Hardfork.allIds;

/**
 * @module allNames
 * @description Get all hardfork names (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";

/**
 * Get all hardfork names in order
 *
 * @returns Array of all hardfork names in chronological order
 */
export const allNames = Hardfork.allNames;

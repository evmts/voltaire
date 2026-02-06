/**
 * @module minMax
 * @description Min/max hardfork functions (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Get the minimum (earliest) hardfork from an array
 *
 * @param forks - Array of hardforks
 * @returns Earliest hardfork
 */
export const min: (forks: HardforkType[]) => HardforkType = Hardfork.min;

/**
 * Get the maximum (latest) hardfork from an array
 *
 * @param forks - Array of hardforks
 * @returns Latest hardfork
 */
export const max: (forks: HardforkType[]) => HardforkType = Hardfork.max;

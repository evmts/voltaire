/**
 * @module equals
 * @description Check hardfork equality (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Check if two hardforks are equal
 *
 * @param a - First hardfork
 * @param b - Second hardfork
 * @returns true if hardforks are the same
 */
export const equals: (a: HardforkType, b: HardforkType) => boolean =
	Hardfork.equals;

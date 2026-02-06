/**
 * @module compare
 * @description Compare hardforks (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Compare two hardforks chronologically
 *
 * @param a - First hardfork
 * @param b - Second hardfork
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export const compare: (a: HardforkType, b: HardforkType) => number =
	Hardfork.compare;

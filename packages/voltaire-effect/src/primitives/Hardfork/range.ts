/**
 * @module range
 * @description Get range of hardforks (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Get a range of hardforks between start and end (inclusive)
 *
 * @param start - Start hardfork
 * @param end - End hardfork
 * @returns Array of hardforks in range
 */
export const range: (
	start: HardforkType,
	end: HardforkType,
) => HardforkType[] = Hardfork.range;

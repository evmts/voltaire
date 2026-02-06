/**
 * @module fromString
 * @description Parse hardfork from string (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Parse a hardfork from string name
 *
 * @param name - Hardfork name (case insensitive)
 * @returns HardforkType or undefined if invalid
 */
export const fromString: (name: string) => HardforkType | undefined =
	Hardfork.fromString;

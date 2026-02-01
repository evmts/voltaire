/**
 * @module toString
 * @description Convert hardfork to string (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";
import type { HardforkType } from "@tevm/voltaire/Hardfork";

/**
 * Convert hardfork to string name
 *
 * @param fork - Hardfork to convert
 * @returns Hardfork name string
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is the function name in our API
export const toString: (fork: HardforkType) => string = Hardfork.toString;

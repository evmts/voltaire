/**
 * @module isValidName
 * @description Validate hardfork name (pure)
 * @since 0.1.0
 */
import * as Hardfork from "@tevm/voltaire/Hardfork";

/**
 * Check if a string is a valid hardfork name
 *
 * @param name - Name to validate
 * @returns true if name is a valid hardfork
 */
export const isValidName: (name: string) => boolean = Hardfork.isValidName;

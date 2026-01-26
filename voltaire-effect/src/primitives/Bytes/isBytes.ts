/**
 * @fileoverview Bytes type check.
 * @module isBytes
 * @since 0.0.1
 */

import { Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";

/**
 * Checks if value is a valid Bytes (Uint8Array).
 *
 * @param value - Value to check
 * @returns true if value is Bytes
 *
 * @example
 * ```typescript
 * const isValid = Bytes.isBytes(someValue) // true or false
 * ```
 *
 * @since 0.0.1
 */
export const isBytes = (value: unknown): boolean => VoltaireBytes.isBytes(value);

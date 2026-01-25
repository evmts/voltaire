/**
 * @fileoverview Int16 type definition.
 * @module Int16/Int16Schema
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";

/**
 * Branded type representing a signed 16-bit integer.
 * Range: -32768 to 32767
 */
export type Int16Type = ReturnType<typeof BrandedInt16.from>;

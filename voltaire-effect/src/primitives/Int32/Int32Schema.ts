/**
 * @fileoverview Int32 type definition.
 * @module Int32/Int32Schema
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";

/**
 * Branded type representing a signed 32-bit integer.
 * Range: -2147483648 to 2147483647
 */
export type Int32Type = ReturnType<typeof BrandedInt32.from>;

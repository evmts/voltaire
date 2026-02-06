/**
 * @fileoverview Int64 type definition.
 * @module Int64/Int64Schema
 * @since 0.1.0
 */

import type { BrandedInt64 } from "@tevm/voltaire";

/**
 * Branded type representing a signed 64-bit integer.
 * Range: -2^63 to 2^63-1
 */
export type Int64Type = ReturnType<typeof BrandedInt64.from>;

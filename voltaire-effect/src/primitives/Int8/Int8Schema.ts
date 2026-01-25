/**
 * @fileoverview Int8 type definition.
 * @module Int8/Int8Schema
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";

/**
 * Branded type representing a signed 8-bit integer.
 * Range: -128 to 127
 */
export type Int8Type = ReturnType<typeof BrandedInt8.from>;

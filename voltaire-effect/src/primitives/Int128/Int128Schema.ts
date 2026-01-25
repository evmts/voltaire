/**
 * @fileoverview Int128 type definition.
 * @module Int128/Int128Schema
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";

/**
 * Branded type representing a signed 128-bit integer.
 * Range: -2^127 to 2^127-1
 */
export type Int128Type = BrandedInt128.BrandedInt128;

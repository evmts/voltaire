/**
 * @fileoverview Int256 type definition.
 * @module Int256/Int256Schema
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";

/**
 * Branded type representing a signed 256-bit integer.
 * Range: -2^255 to 2^255-1
 * This is the native signed integer type used in Solidity (int256).
 */
export type Int256Type = BrandedInt256.BrandedInt256;

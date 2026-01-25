/**
 * @fileoverview Pure absolute value for Int8.
 * @module Int8/abs
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const abs = (value: Int8Type): Int8Type => BrandedInt8.abs(value);

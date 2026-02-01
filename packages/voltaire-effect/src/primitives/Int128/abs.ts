/**
 * @fileoverview Pure absolute value for Int128.
 * @module Int128/abs
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import type { Int128Type } from "./Int128Schema.js";

export const abs = (value: Int128Type): Int128Type => BrandedInt128.abs(value);

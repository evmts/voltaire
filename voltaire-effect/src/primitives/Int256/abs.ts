/**
 * @fileoverview Pure absolute value for Int256.
 * @module Int256/abs
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const abs = (value: Int256Type): Int256Type => BrandedInt256.abs(value);

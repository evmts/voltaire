/**
 * @fileoverview Pure negation for Int8.
 * @module Int8/negate
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const negate = (value: Int8Type): Int8Type => BrandedInt8.negate(value);

/**
 * @fileoverview Pure negation for Int64.
 * @module Int64/negate
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const negate = (value: Int64Type): Int64Type =>
	BrandedInt64.negate(value);

/**
 * @fileoverview Pure multiplication for Int64.
 * @module Int64/mul
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const mul = (a: Int64Type, b: Int64Type): Int64Type =>
	BrandedInt64.times(a, b);

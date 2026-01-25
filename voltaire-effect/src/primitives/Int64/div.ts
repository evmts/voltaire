/**
 * @fileoverview Pure division for Int64.
 * @module Int64/div
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const div = (a: Int64Type, b: Int64Type): Int64Type =>
	BrandedInt64.dividedBy(a, b);

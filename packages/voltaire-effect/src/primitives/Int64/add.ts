/**
 * @fileoverview Pure addition for Int64.
 * @module Int64/add
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const add = (a: Int64Type, b: Int64Type): Int64Type =>
	BrandedInt64.plus(a, b);

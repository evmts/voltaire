/**
 * @fileoverview Pure equality comparison for Int64.
 * @module Int64/equals
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const equals = (a: Int64Type, b: Int64Type): boolean =>
	BrandedInt64.equals(a, b);

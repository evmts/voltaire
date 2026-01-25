/**
 * @fileoverview Pure negative check for Int64.
 * @module Int64/isNegative
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const isNegative = (value: Int64Type): boolean =>
	BrandedInt64.isNegative(value);

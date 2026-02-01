/**
 * @fileoverview Pure negative check for Int32.
 * @module Int32/isNegative
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";
import type { Int32Type } from "./Int32Schema.js";

export const isNegative = (value: Int32Type): boolean =>
	BrandedInt32.isNegative(value);

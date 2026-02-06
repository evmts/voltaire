/**
 * @fileoverview Pure equality comparison for Int32.
 * @module Int32/equals
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";
import type { Int32Type } from "./Int32Schema.js";

export const equals = (a: Int32Type, b: Int32Type): boolean =>
	BrandedInt32.equals(a, b);

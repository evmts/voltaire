/**
 * @fileoverview Pure equality comparison for Int128.
 * @module Int128/equals
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import type { Int128Type } from "./Int128Schema.js";

export const equals = (a: Int128Type, b: Int128Type): boolean =>
	BrandedInt128.equals(a, b);

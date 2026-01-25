/**
 * @fileoverview Pure equality comparison for Int8.
 * @module Int8/equals
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const equals = (a: Int8Type, b: Int8Type): boolean =>
	BrandedInt8.equals(a, b);

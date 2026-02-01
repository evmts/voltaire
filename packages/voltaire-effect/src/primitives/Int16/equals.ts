/**
 * @fileoverview Pure equality comparison for Int16.
 * @module Int16/equals
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const equals = (a: Int16Type, b: Int16Type): boolean =>
	BrandedInt16.equals(a, b);

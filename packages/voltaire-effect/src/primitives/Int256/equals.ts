/**
 * @fileoverview Pure equality comparison for Int256.
 * @module Int256/equals
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const equals = (a: Int256Type, b: Int256Type): boolean =>
	BrandedInt256.equals(a, b);

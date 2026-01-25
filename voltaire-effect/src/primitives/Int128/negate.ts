/**
 * @fileoverview Pure negation for Int128.
 * @module Int128/negate
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import type { Int128Type } from "./Int128Schema.js";

export const negate = (value: Int128Type): Int128Type =>
	BrandedInt128.negate(value);

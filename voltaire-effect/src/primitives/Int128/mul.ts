/**
 * @fileoverview Pure multiplication for Int128.
 * @module Int128/mul
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import type { Int128Type } from "./Int128Schema.js";

export const mul = (a: Int128Type, b: Int128Type): Int128Type =>
	BrandedInt128.times(a, b);

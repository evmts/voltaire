/**
 * @fileoverview Pure multiplication for Int8.
 * @module Int8/mul
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const mul = (a: Int8Type, b: Int8Type): Int8Type =>
	BrandedInt8.times(a, b);

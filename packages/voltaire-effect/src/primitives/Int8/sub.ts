/**
 * @fileoverview Pure subtraction for Int8.
 * @module Int8/sub
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const sub = (a: Int8Type, b: Int8Type): Int8Type =>
	BrandedInt8.minus(a, b);

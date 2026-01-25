/**
 * @fileoverview Pure subtraction for Int32.
 * @module Int32/sub
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";
import type { Int32Type } from "./Int32Schema.js";

export const sub = (a: Int32Type, b: Int32Type): Int32Type =>
	BrandedInt32.minus(a, b);

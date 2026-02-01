/**
 * @fileoverview Pure subtraction for Int16.
 * @module Int16/sub
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const sub = (a: Int16Type, b: Int16Type): Int16Type =>
	BrandedInt16.minus(a, b);

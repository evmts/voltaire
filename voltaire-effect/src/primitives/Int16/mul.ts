/**
 * @fileoverview Pure multiplication for Int16.
 * @module Int16/mul
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const mul = (a: Int16Type, b: Int16Type): Int16Type =>
	BrandedInt16.times(a, b);

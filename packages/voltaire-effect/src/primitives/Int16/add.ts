/**
 * @fileoverview Pure addition for Int16.
 * @module Int16/add
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const add = (a: Int16Type, b: Int16Type): Int16Type =>
	BrandedInt16.plus(a, b);

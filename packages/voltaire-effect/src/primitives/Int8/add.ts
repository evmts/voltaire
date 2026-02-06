/**
 * @fileoverview Pure addition for Int8.
 * @module Int8/add
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const add = (a: Int8Type, b: Int8Type): Int8Type =>
	BrandedInt8.plus(a, b);

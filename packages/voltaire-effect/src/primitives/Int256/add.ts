/**
 * @fileoverview Pure addition for Int256.
 * @module Int256/add
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const add = (a: Int256Type, b: Int256Type): Int256Type =>
	BrandedInt256.plus(a, b);

/**
 * @fileoverview Pure subtraction for Int256.
 * @module Int256/sub
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const sub = (a: Int256Type, b: Int256Type): Int256Type =>
	BrandedInt256.minus(a, b);

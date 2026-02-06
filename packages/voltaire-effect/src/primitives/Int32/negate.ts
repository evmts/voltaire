/**
 * @fileoverview Pure negation for Int32.
 * @module Int32/negate
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";
import type { Int32Type } from "./Int32Schema.js";

export const negate = (value: Int32Type): Int32Type =>
	BrandedInt32.negate(value);

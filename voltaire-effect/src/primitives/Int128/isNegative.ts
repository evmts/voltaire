/**
 * @fileoverview Pure negative check for Int128.
 * @module Int128/isNegative
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import type { Int128Type } from "./Int128Schema.js";

export const isNegative = (value: Int128Type): boolean =>
	BrandedInt128.isNegative(value);

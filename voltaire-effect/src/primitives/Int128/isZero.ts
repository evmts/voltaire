/**
 * @fileoverview Pure zero check for Int128.
 * @module Int128/isZero
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import type { Int128Type } from "./Int128Schema.js";

export const isZero = (value: Int128Type): boolean =>
	BrandedInt128.isZero(value);

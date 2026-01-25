/**
 * @fileoverview Pure negative check for Int16.
 * @module Int16/isNegative
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const isNegative = (value: Int16Type): boolean =>
	BrandedInt16.isNegative(value);

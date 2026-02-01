/**
 * @fileoverview Pure negative check for Int256.
 * @module Int256/isNegative
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const isNegative = (value: Int256Type): boolean =>
	BrandedInt256.isNegative(value);

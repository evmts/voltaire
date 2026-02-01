/**
 * @fileoverview Pure negation for Int256.
 * @module Int256/negate
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const negate = (value: Int256Type): Int256Type =>
	BrandedInt256.negate(value);

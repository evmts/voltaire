/**
 * @fileoverview Pure division for Int256.
 * @module Int256/div
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const div = (a: Int256Type, b: Int256Type): Int256Type =>
	BrandedInt256.dividedBy(a, b);

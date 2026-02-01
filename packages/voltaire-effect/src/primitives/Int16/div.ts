/**
 * @fileoverview Pure division for Int16.
 * @module Int16/div
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const div = (a: Int16Type, b: Int16Type): Int16Type =>
	BrandedInt16.dividedBy(a, b);

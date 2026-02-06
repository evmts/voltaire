/**
 * @fileoverview Pure comparison for Int64.
 * @module Int64/compare
 * @since 0.1.0
 */

import type { Int64Type } from "./Int64Schema.js";

export const compare = (a: Int64Type, b: Int64Type): -1 | 0 | 1 => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

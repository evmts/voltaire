/**
 * @fileoverview Pure comparison for Int32.
 * @module Int32/compare
 * @since 0.1.0
 */

import type { Int32Type } from "./Int32Schema.js";

export const compare = (a: Int32Type, b: Int32Type): -1 | 0 | 1 => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

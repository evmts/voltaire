/**
 * @fileoverview Pure comparison for Int128.
 * @module Int128/compare
 * @since 0.1.0
 */

import type { Int128Type } from "./Int128Schema.js";

export const compare = (a: Int128Type, b: Int128Type): -1 | 0 | 1 => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

/**
 * @fileoverview Pure comparison for Int8.
 * @module Int8/compare
 * @since 0.1.0
 */

import type { Int8Type } from "./Int8Schema.js";

export const compare = (a: Int8Type, b: Int8Type): -1 | 0 | 1 => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

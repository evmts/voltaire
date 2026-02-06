/**
 * @fileoverview Pure comparison for Int16.
 * @module Int16/compare
 * @since 0.1.0
 */

import type { Int16Type } from "./Int16Schema.js";

export const compare = (a: Int16Type, b: Int16Type): -1 | 0 | 1 => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

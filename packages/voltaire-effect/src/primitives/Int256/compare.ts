/**
 * @fileoverview Pure comparison for Int256.
 * @module Int256/compare
 * @since 0.1.0
 */

import type { Int256Type } from "./Int256Schema.js";

export const compare = (a: Int256Type, b: Int256Type): -1 | 0 | 1 => {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
};

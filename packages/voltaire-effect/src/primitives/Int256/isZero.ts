/**
 * @fileoverview Pure zero check for Int256.
 * @module Int256/isZero
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import type { Int256Type } from "./Int256Schema.js";

export const isZero = (value: Int256Type): boolean =>
	BrandedInt256.isZero(value);

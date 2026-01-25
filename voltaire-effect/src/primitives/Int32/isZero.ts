/**
 * @fileoverview Pure zero check for Int32.
 * @module Int32/isZero
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";
import type { Int32Type } from "./Int32Schema.js";

export const isZero = (value: Int32Type): boolean => BrandedInt32.isZero(value);

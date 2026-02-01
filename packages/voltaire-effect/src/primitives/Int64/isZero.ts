/**
 * @fileoverview Pure zero check for Int64.
 * @module Int64/isZero
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import type { Int64Type } from "./Int64Schema.js";

export const isZero = (value: Int64Type): boolean => BrandedInt64.isZero(value);

/**
 * @fileoverview Pure zero check for Int8.
 * @module Int8/isZero
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import type { Int8Type } from "./Int8Schema.js";

export const isZero = (value: Int8Type): boolean => BrandedInt8.isZero(value);

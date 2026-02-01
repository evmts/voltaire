/**
 * @fileoverview Pure absolute value for Int16.
 * @module Int16/abs
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const abs = (value: Int16Type): Int16Type => BrandedInt16.abs(value);

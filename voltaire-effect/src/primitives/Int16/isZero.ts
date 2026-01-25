/**
 * @fileoverview Pure zero check for Int16.
 * @module Int16/isZero
 * @since 0.1.0
 */

import { BrandedInt16 } from "@tevm/voltaire";
import type { Int16Type } from "./Int16Schema.js";

export const isZero = (value: Int16Type): boolean => BrandedInt16.isZero(value);

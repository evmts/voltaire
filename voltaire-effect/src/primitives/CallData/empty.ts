/**
 * @fileoverview Empty call data constant.
 * @module CallData/empty
 * @since 0.1.0
 */

import { Hex as VoltaireHex } from "@tevm/voltaire/Hex";
import type { CallDataType } from "./Hex.js";

/**
 * Creates empty call data (0x).
 *
 * @returns Empty CallData value
 *
 * @example
 * ```typescript
 * import * as CallData from 'voltaire-effect/primitives/CallData'
 *
 * const emptyData = CallData.empty()
 * ```
 *
 * @since 0.1.0
 */
export const empty = (): CallDataType => VoltaireHex("0x") as CallDataType;

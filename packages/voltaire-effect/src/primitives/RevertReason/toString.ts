/**
 * @fileoverview Pure function to convert RevertReason to string.
 * @module RevertReason/toString
 * @since 0.1.0
 */

import { RevertReason } from "@tevm/voltaire";
import type { RevertReasonType } from "./RevertReasonSchema.js";

/**
 * Converts a revert reason to a human-readable string.
 *
 * @param reason - The parsed revert reason
 * @returns Human-readable description of the revert
 *
 * @example
 * ```typescript
 * import * as RevertReason from 'voltaire-effect/primitives/RevertReason'
 * import * as S from 'effect/Schema'
 *
 * const reason = S.decodeSync(RevertReason.Hex)(revertData)
 * console.log(RevertReason.toString(reason)) // 'Error: Insufficient balance'
 * ```
 *
 * @since 0.1.0
 */
export const toString = (reason: RevertReasonType): string =>
	RevertReason.toString(reason);

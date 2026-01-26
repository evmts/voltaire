/**
 * @fileoverview Shared schema declaration for BlockNumberType.
 * @module BlockNumber/BlockNumberTypeSchema
 * @since 0.1.0
 */

import { BlockNumber } from "@tevm/voltaire";
import * as S from "effect/Schema";

type BlockNumberType = BlockNumber.BlockNumberType;

/**
 * Canonical schema declaration for BlockNumberType.
 * Validates that a value is a non-negative bigint.
 *
 * @since 0.1.0
 */
export const BlockNumberTypeSchema = S.declare<BlockNumberType>(
	(u): u is BlockNumberType => typeof u === "bigint" && u >= 0n,
	{ identifier: "BlockNumber" },
);

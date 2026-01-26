/**
 * @fileoverview Arbitrum L2 formatter layer.
 *
 * @module arbitrum
 * @since 0.0.1
 */

import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { FormatterService } from "../FormatterService.js";

/**
 * Arbitrum formatter layer.
 *
 * @since 0.0.1
 */
export const ArbitrumFormatter = Layer.succeed(FormatterService, {
	formatBlock: (rpc: unknown) => Effect.succeed(rpc),
	formatTransaction: (rpc: unknown) => {
		const tx = rpc as Record<string, unknown>;
		return Effect.succeed({
			...tx,
			gasUsedForL1: tx.gasUsedForL1,
			l1BlockNumber: tx.l1BlockNumber,
		});
	},
	formatReceipt: (rpc: unknown) => {
		const receipt = rpc as Record<string, unknown>;
		return Effect.succeed({
			...receipt,
			gasUsedForL1: receipt.gasUsedForL1,
		});
	},
	formatRequest: (tx: unknown) => Effect.succeed(tx),
});
